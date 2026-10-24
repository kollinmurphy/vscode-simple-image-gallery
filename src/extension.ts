import * as vscode from 'vscode';
import * as path from 'path';
import {
  GalleryPanel,
  GalleryPanelSerializer,
  promptForFolderScope,
} from './panels/GalleryPanel';

async function resolveTargetFolder(uri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  if (!uri) {
    return undefined;
  }
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    if (stat.type === vscode.FileType.Directory) {
      return uri;
    }
    // If a file was selected, target its containing folder
    return vscode.Uri.file(path.dirname(uri.fsPath));
  } catch {
    return uri;
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Command: Open for Entire Workspace (or passed URI if invoked with resource)
  const openGalleryDisposable = vscode.commands.registerCommand(
    'vscode-image-gallery.openGallery',
    async (uri?: vscode.Uri) => {
      const targetFolder = await resolveTargetFolder(uri);
      GalleryPanel.createOrShow(context.extensionUri, targetFolder);
    }
  );

  // Command: Explicitly open for a specific folder (prompts if no folder provided)
  const openGalleryForFolderDisposable = vscode.commands.registerCommand(
    'vscode-image-gallery.openGalleryForFolder',
    async (uri?: vscode.Uri) => {
      let targetFolder = await resolveTargetFolder(uri);
      if (!targetFolder) {
        const picked = await promptForFolderScope();
        if (picked === undefined) {
          return;
        }
        targetFolder = picked === 'workspace' ? undefined : picked;
      }
      GalleryPanel.createOrShow(context.extensionUri, targetFolder);
    }
  );

  const reopenGalleryDisposable = vscode.commands.registerCommand(
    'vscode-image-gallery.reopenLastGallery',
    () => GalleryPanel.reopenLast(context.extensionUri)
  );

  context.subscriptions.push(openGalleryDisposable, openGalleryForFolderDisposable, reopenGalleryDisposable);

  // Register WebviewPanel serializer to restore the Gallery GUI across sessions
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer(
      GalleryPanel.viewType,
      new GalleryPanelSerializer(context.extensionUri)
    )
  );
}

export function deactivate() {
  GalleryPanel.currentPanel?.dispose();
}
