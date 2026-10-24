import * as vscode from 'vscode';
import { GalleryPanel, GalleryPanelSerializer } from './panels/GalleryPanel';

export function activate(context: vscode.ExtensionContext) {
  // Register command to open the Image Gallery Web GUI
  const openGalleryDisposable = vscode.commands.registerCommand(
    'vscode-image-gallery.openGallery',
    () => {
      GalleryPanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(openGalleryDisposable);

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
