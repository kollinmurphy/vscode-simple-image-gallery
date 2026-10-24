import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Image Gallery command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.strictEqual(
      commands.includes('vscode-image-gallery.openGallery'),
      true,
      'Command vscode-image-gallery.openGallery should be registered'
    );
  });
});
