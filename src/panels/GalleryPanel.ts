import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  ExtensionToWebviewMessage,
  GalleryImage,
  WebviewToExtensionMessage,
} from '../shared/types';

export async function promptForFolderScope(): Promise<vscode.Uri | 'workspace' | undefined> {
  interface ScopeQuickPickItem extends vscode.QuickPickItem {
    uri?: vscode.Uri;
    action?: 'workspace' | 'select' | 'open' | 'back' | 'dialog';
  }

  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  const ignoredFolders = new Set(['node_modules', '.git', '.vscode', 'dist', 'out', 'build']);
  const folderStack: vscode.Uri[] = [];
  let currentFolder: vscode.Uri | undefined;

  while (true) {
    const items: ScopeQuickPickItem[] = [];

    if (!currentFolder) {
      items.push({
        label: '$(root-folder) Entire Workspace',
        description: vscode.workspace.name ? `All folders in ${vscode.workspace.name}` : 'All folders in workspace',
        action: 'workspace',
      });

      for (const folder of workspaceFolders) {
        items.push({
          label: `$(folder-opened) ${folder.name}`,
          description: vscode.workspace.asRelativePath(folder.uri),
          uri: folder.uri,
          action: 'open',
        });
      }
    } else {
      items.push({
        label: `$(check) Use ${path.basename(currentFolder.fsPath)}`,
        description: vscode.workspace.asRelativePath(currentFolder, false),
        uri: currentFolder,
        action: 'select',
      });
      items.push({
        label: folderStack.length === 0 ? '$(arrow-left) Back to workspace roots' : '$(arrow-left) Back',
        action: 'back',
      });

      try {
        const entries = await vscode.workspace.fs.readDirectory(currentFolder);
        const folders = entries
          .filter(([name, type]) =>
            type === vscode.FileType.Directory &&
            !name.startsWith('.') &&
            !ignoredFolders.has(name)
          )
          .sort(([first], [second]) => first.localeCompare(second, undefined, { sensitivity: 'base' }));

        for (const [name] of folders) {
          items.push({
            label: `$(folder) ${name}`,
            uri: vscode.Uri.joinPath(currentFolder, name),
            action: 'open',
          });
        }
      } catch {
        // Selection remains available even when directory contents cannot be read.
      }
    }

    items.push({
      label: '$(folder-opened) Browse for another folder...',
      description: 'Choose a folder outside the workspace hierarchy',
      action: 'dialog',
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: currentFolder
        ? `Browse folders within ${path.basename(currentFolder.fsPath)}`
        : 'Select a gallery scope',
      title: 'Select Gallery Scope',
    });

    if (!selected) {
      return undefined;
    }

    switch (selected.action) {
      case 'workspace':
        return 'workspace';
      case 'select':
        return selected.uri;
      case 'open':
        if (!currentFolder && selected.uri) {
          folderStack.push(selected.uri);
          currentFolder = selected.uri;
        } else if (selected.uri) {
          folderStack.push(selected.uri);
          currentFolder = selected.uri;
        }
        break;
      case 'back':
        folderStack.pop();
        currentFolder = folderStack.at(-1);
        break;
      case 'dialog': {
        const dialogResult = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Select Folder',
          title: 'Select Folder for Image Gallery',
        });
        return dialogResult?.[0];
      }
    }
  }
}

export class GalleryPanel {
  public static currentPanel: GalleryPanel | undefined;
  public static readonly viewType = 'vscode-image-gallery.galleryPanel';
  private static _lastTargetFolderUri: vscode.Uri | undefined;
  private static _hasOpenedGallery = false;

  public static reopenLast(extensionUri: vscode.Uri): boolean {
    if (!GalleryPanel._hasOpenedGallery) {
      return false;
    }
    GalleryPanel.createOrShow(extensionUri, GalleryPanel._lastTargetFolderUri);
    return true;
  }

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _targetFolderUri?: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _watcherDisposable?: vscode.Disposable;
  private _refreshDebounceTimer?: NodeJS.Timeout;
  private _pendingInspectingImageId?: string;

  public static async createOrShow(
    extensionUri: vscode.Uri,
    targetFolderUri?: vscode.Uri,
    inspectingImageId?: string
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (GalleryPanel.currentPanel) {
      GalleryPanel.currentPanel.setPendingInspection(inspectingImageId);
      if (targetFolderUri !== undefined || inspectingImageId !== undefined) {
        await GalleryPanel.currentPanel.setTargetFolder(targetFolderUri);
      }
      GalleryPanel.currentPanel._panel.reveal(column);
      return;
    }

    const initialScopeLabel = targetFolderUri
      ? vscode.workspace.asRelativePath(targetFolderUri, false)
      : 'Entire Workspace';

    const panel = vscode.window.createWebviewPanel(
      GalleryPanel.viewType,
      targetFolderUri ? `Gallery: ${initialScopeLabel}` : 'Image Gallery',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: GalleryPanel._calculateResourceRoots(extensionUri, targetFolderUri),
      }
    );

    GalleryPanel._lastTargetFolderUri = targetFolderUri;
    GalleryPanel._hasOpenedGallery = true;
    void vscode.commands.executeCommand('setContext', 'vscode-image-gallery.galleryClosed', false);
    GalleryPanel.currentPanel = new GalleryPanel(
      panel,
      extensionUri,
      targetFolderUri,
      inspectingImageId
    );
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    GalleryPanel.currentPanel = new GalleryPanel(panel, extensionUri);
  }

  private static _calculateResourceRoots(
    extensionUri: vscode.Uri,
    targetFolderUri?: vscode.Uri
  ): vscode.Uri[] {
    return [
      vscode.Uri.joinPath(extensionUri, 'dist'),
      ...(vscode.workspace.workspaceFolders?.map((wf) => wf.uri) ?? []),
      ...(targetFolderUri ? [targetFolderUri] : []),
    ];
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    targetFolderUri?: vscode.Uri,
    inspectingImageId?: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._targetFolderUri = targetFolderUri;
    this._pendingInspectingImageId = inspectingImageId;

    this._panel.iconPath = vscode.Uri.joinPath(this._extensionUri, 'icon.png');

    this._updateTitle();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => {
        this._handleMessage(message);
      },
      null,
      this._disposables
    );

    this._setupFileWatcher();
    this._update();
  }

  public setPendingInspection(inspectingImageId?: string) {
    this._pendingInspectingImageId = inspectingImageId;
  }

  public async setTargetFolder(folderUri?: vscode.Uri) {
    this._targetFolderUri = folderUri;
    this._panel.webview.options = {
      enableScripts: true,
      localResourceRoots: GalleryPanel._calculateResourceRoots(
        this._extensionUri,
        this._targetFolderUri
      ),
    };
    this._updateTitle();
    this._setupFileWatcher();

    this._postMessage({ type: 'setLoading', payload: { isLoading: true } });
    const images = await this._scanImages();
    this._postMessage({
      type: 'setScope',
      payload: {
        scopeLabel: this._getScopeLabel(),
        images,
        inspectingImageId: this._pendingInspectingImageId,
      },
    });
    this._pendingInspectingImageId = undefined;
  }

  private _getScopeLabel(): string {
    if (!this._targetFolderUri) {
      return 'Entire Workspace';
    }
    const rel = vscode.workspace.asRelativePath(this._targetFolderUri, false);
    if (rel !== this._targetFolderUri.fsPath) {
      return rel;
    }
    return path.basename(this._targetFolderUri.fsPath);
  }

  private _updateTitle() {
    const scopeLabel = this._getScopeLabel();
    this._panel.title =
      scopeLabel === 'Entire Workspace' ? 'Image Gallery' : `Gallery: ${scopeLabel}`;
  }

  public dispose() {
    GalleryPanel._lastTargetFolderUri = this._targetFolderUri;
    GalleryPanel._hasOpenedGallery = true;
    void vscode.commands.executeCommand('setContext', 'vscode-image-gallery.galleryClosed', true);
    GalleryPanel.currentPanel = undefined;

    if (this._watcherDisposable) {
      this._watcherDisposable.dispose();
    }
    if (this._refreshDebounceTimer) {
      clearTimeout(this._refreshDebounceTimer);
    }

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _postMessage(message: ExtensionToWebviewMessage) {
    this._panel.webview.postMessage(message);
  }

  private async _handleMessage(message: WebviewToExtensionMessage) {
    switch (message.type) {
      case 'ready': {
        const images = await this._scanImages();
        const workspaceName = vscode.workspace.name || 'Workspace';
        this._postMessage({
          type: 'init',
          payload: {
            workspaceName,
            images,
            scopeLabel: this._getScopeLabel(),
            inspectingImageId: this._pendingInspectingImageId,
          },
        });
        this._pendingInspectingImageId = undefined;
        break;
      }
      case 'refresh': {
        this._postMessage({ type: 'setLoading', payload: { isLoading: true } });
        const images = await this._scanImages();
        this._postMessage({ type: 'setImages', payload: { images } });
        break;
      }
      case 'changeScope': {
        const picked = await promptForFolderScope();
        if (picked !== undefined) {
          const folderUri = picked === 'workspace' ? undefined : picked;
          await this.setTargetFolder(folderUri);
        }
        break;
      }
      case 'openFile': {
        try {
          const fileUri = vscode.Uri.file(message.filePath);
          await vscode.commands.executeCommand('vscode.open', fileUri);
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to open file: ${String(err)}`);
        }
        break;
      }
      case 'revealInExplorer': {
        try {
          const fileUri = vscode.Uri.file(message.filePath);
          await vscode.commands.executeCommand('revealFileInOS', fileUri);
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to reveal file: ${String(err)}`);
        }
        break;
      }
      case 'copyToClipboard': {
        await vscode.env.clipboard.writeText(message.text);
        const label = message.label ? ` (${message.label})` : '';
        vscode.window.setStatusBarMessage(`Copied to clipboard${label}`, 3000);
        break;
      }
      case 'showInfo': {
        vscode.window.showInformationMessage(message.message);
        break;
      }
      case 'showWarning': {
        vscode.window.showWarningMessage(message.message);
        break;
      }
      case 'showError': {
        vscode.window.showErrorMessage(message.message);
        break;
      }
    }
  }

  private _setupFileWatcher() {
    if (this._watcherDisposable) {
      this._watcherDisposable.dispose();
    }

    const pattern = '**/*.{png,jpg,jpeg,gif,webp,svg,bmp,ico,avif}';
    const watcherPattern = this._targetFolderUri
      ? new vscode.RelativePattern(this._targetFolderUri, pattern)
      : pattern;

    const watcher = vscode.workspace.createFileSystemWatcher(watcherPattern);

    const scheduleRefresh = () => {
      if (this._refreshDebounceTimer) {
        clearTimeout(this._refreshDebounceTimer);
      }
      this._refreshDebounceTimer = setTimeout(async () => {
        const images = await this._scanImages();
        this._postMessage({ type: 'setImages', payload: { images } });
      }, 500);
    };

    watcher.onDidCreate(scheduleRefresh, this, this._disposables);
    watcher.onDidChange(scheduleRefresh, this, this._disposables);
    watcher.onDidDelete(scheduleRefresh, this, this._disposables);

    this._watcherDisposable = watcher;
  }

  private async _scanImages(): Promise<GalleryImage[]> {
    const pattern = '**/*.{png,jpg,jpeg,gif,webp,svg,bmp,ico,avif}';
    const excludePattern = '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/build/**}';

    try {
      let uris: vscode.Uri[] = [];

      if (this._targetFolderUri) {
        const globPattern = new vscode.RelativePattern(this._targetFolderUri, pattern);
        uris = await vscode.workspace.findFiles(globPattern, excludePattern);

        // Fallback for folders outside current workspace folders
        if (uris.length === 0) {
          uris = await this._scanDirectoryFs(this._targetFolderUri);
        }
      } else {
        uris = await vscode.workspace.findFiles(pattern, excludePattern);
      }

      const images: GalleryImage[] = [];

      for (const uri of uris) {
        try {
          const stat = await vscode.workspace.fs.stat(uri);
          const ext = path.extname(uri.fsPath).replace(/^\./, '').toLowerCase();
          const relativePath = this._targetFolderUri
            ? path.relative(this._targetFolderUri.fsPath, uri.fsPath) || path.basename(uri.fsPath)
            : vscode.workspace.asRelativePath(uri);
          const webviewUri = this._panel.webview.asWebviewUri(uri).toString();

          images.push({
            id: uri.toString(),
            name: path.basename(uri.fsPath),
            path: relativePath,
            fullPath: uri.fsPath,
            uri: webviewUri,
            sizeBytes: stat.size,
            extension: ext,
            modifiedTimestamp: stat.mtime,
            createdTimestamp: stat.ctime,
          });
        } catch {
          // Skip inaccessible files
        }
      }

      return images;
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to scan images: ${String(err)}`);
      return [];
    }
  }

  private async _scanDirectoryFs(dirUri: vscode.Uri, depth = 0): Promise<vscode.Uri[]> {
    if (depth > 8) {
      return [];
    }
    const validExtensions = new Set([
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'svg',
      'bmp',
      'ico',
      'avif',
    ]);
    const ignoreNames = new Set(['node_modules', '.git', 'dist', 'out', 'build', '.vscode']);
    const results: vscode.Uri[] = [];

    try {
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      for (const [name, type] of entries) {
        if (ignoreNames.has(name) || name.startsWith('.')) {
          continue;
        }
        const entryUri = vscode.Uri.joinPath(dirUri, name);
        if (type === vscode.FileType.Directory) {
          const nested = await this._scanDirectoryFs(entryUri, depth + 1);
          results.push(...nested);
        } else if (type === vscode.FileType.File) {
          const ext = path.extname(name).replace(/^\./, '').toLowerCase();
          if (validExtensions.has(ext)) {
            results.push(entryUri);
          }
        }
      }
    } catch {
      // Ignore read errors
    }

    return results;
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    const nonce = crypto.randomBytes(16).toString('base64');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data: blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
  <title>Image Gallery</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

export class GalleryPanelSerializer implements vscode.WebviewPanelSerializer {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    _state: unknown
  ): Promise<void> {
    const resourceRoots = [
      vscode.Uri.joinPath(this._extensionUri, 'dist'),
      ...(vscode.workspace.workspaceFolders?.map((wf) => wf.uri) ?? []),
    ];
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: resourceRoots,
    };
    GalleryPanel.revive(webviewPanel, this._extensionUri);
  }
}
