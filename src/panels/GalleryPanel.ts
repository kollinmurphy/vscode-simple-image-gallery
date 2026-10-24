import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  ExtensionToWebviewMessage,
  GalleryImage,
  WebviewToExtensionMessage,
} from '../shared/types';

export class GalleryPanel {
  public static currentPanel: GalleryPanel | undefined;
  public static readonly viewType = 'vscode-image-gallery.galleryPanel';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _watcherDisposable?: vscode.Disposable;
  private _refreshDebounceTimer?: NodeJS.Timeout;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (GalleryPanel.currentPanel) {
      GalleryPanel.currentPanel._panel.reveal(column);
      return;
    }

    const resourceRoots = [
      vscode.Uri.joinPath(extensionUri, 'dist'),
      ...(vscode.workspace.workspaceFolders?.map((wf) => wf.uri) ?? []),
    ];

    const panel = vscode.window.createWebviewPanel(
      GalleryPanel.viewType,
      'Image Gallery',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: resourceRoots,
      }
    );

    GalleryPanel.currentPanel = new GalleryPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    GalleryPanel.currentPanel = new GalleryPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.iconPath = {
      light: vscode.Uri.joinPath(this._extensionUri, 'dist', 'icon-light.svg'),
      dark: vscode.Uri.joinPath(this._extensionUri, 'dist', 'icon-dark.svg'),
    };

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => {
        this._handleMessage(message);
      },
      null,
      this._disposables
    );

    this._setupFileWatcher();
  }

  public dispose() {
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
          },
        });
        break;
      }
      case 'refresh': {
        this._postMessage({ type: 'setLoading', payload: { isLoading: true } });
        const images = await this._scanImages();
        this._postMessage({ type: 'setImages', payload: { images } });
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
    const watcher = vscode.workspace.createFileSystemWatcher(
      '**/*.{png,jpg,jpeg,gif,webp,svg,bmp,ico,avif}'
    );

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
      const uris = await vscode.workspace.findFiles(pattern, excludePattern);
      const images: GalleryImage[] = [];

      for (const uri of uris) {
        try {
          const stat = await vscode.workspace.fs.stat(uri);
          const ext = path.extname(uri.fsPath).replace(/^\./, '').toLowerCase();
          const relativePath = vscode.workspace.asRelativePath(uri);
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

