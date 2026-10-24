import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  let extension: vscode.Extension<unknown>;

  suiteSetup(async () => {
    const candidate = vscode.extensions.all.find(
      (extensionCandidate) => extensionCandidate.packageJSON.name === 'vscode-simple-image-gallery'
    );
    assert.ok(candidate, 'Image Gallery extension should be installed in the test host');
    extension = candidate;
    await extension.activate();
  });

  test('Image Gallery commands are registered after activation', async () => {
    const expectedCommands = [
      'vscode-simple-image-gallery.openGallery',
      'vscode-simple-image-gallery.openGalleryForFolder',
      'vscode-simple-image-gallery.reopenLastGallery',
    ];
    const commands = await vscode.commands.getCommands(true);

    for (const command of expectedCommands) {
      assert.ok(commands.includes(command), `Command ${command} should be registered`);
    }
  });

  test('extension manifest contains required marketplace metadata', () => {
    const manifest = extension.packageJSON;

    assert.strictEqual(manifest.name, 'vscode-simple-image-gallery');
    assert.strictEqual(manifest.publisher, 'KollinMurphy');
    assert.strictEqual(manifest.icon, 'icon.png');
    assert.strictEqual(manifest.license, 'MIT');
    assert.strictEqual(manifest.repository.type, 'git');
    assert.match(manifest.repository.url, /^https:\/\/github\.com\//);
    assert.ok(Array.isArray(manifest.keywords) && manifest.keywords.length >= 5);
    assert.ok(manifest.contributes?.commands?.length >= 3);
  });
});
