import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Image Gallery command is registered', async () => {
    const extension = vscode.extensions.all.find(
      (candidate) => candidate.packageJSON.name === 'vscode-image-gallery'
    );
    assert.ok(extension, 'Image Gallery extension should be installed in the test host');

    console.log('Activating extension:', extension.id);
    await extension.activate();

    const command = 'vscode-image-gallery.openGallery';
    const commands = await vscode.commands.getCommands(true);
    console.log('Checking registered command:', command);
    assert.strictEqual(
      commands.includes(command),
      true,
      `Command ${command} should be registered`
    );
  });
});
