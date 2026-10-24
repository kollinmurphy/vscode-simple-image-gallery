# VS Code Image Gallery Extension

A rich, interactive visual Image Gallery web GUI for Visual Studio Code. Browse, inspect, filter, and manage image assets directly within your workspace editor.

## Features

- **Interactive Web GUI**: Full-featured Webview panel with responsive layouts.
- **Multiple View Modes**:
  - **Grid View**: Visual cards with transparent checkerboard support, hover zoom, and thumbnail scaling.
  - **Compact View**: High-density square grid.
  - **List View**: Detailed list displaying file path, format, file size, and last modified date.
- **Search & Filtering**:
  - Instant full-text search across image filenames and relative paths.
  - Format chip filters (PNG, JPG, SVG, WebP, GIF, etc.) with real-time asset counts.
  - Multi-field sorting (Name, File Size, Last Modified, File Type) with ascending/descending toggle.
- **Dynamic Zoom Control**: Slide to resize thumbnail cards dynamically in Grid View.
- **Detailed Inspector Lightbox**:
  - Large preview modal with high-resolution inspection.
  - File metadata summary (dimensions, bytes, relative and absolute paths, date).
  - Quick actions: Open in VS Code Editor, Reveal in File Explorer, Copy Path.
- **Live File Watcher**: Automatically detects newly added, modified, or deleted image files in your workspace and updates the GUI in real time.
- **Session Persistence**: Restores active panels and state across VS Code restarts using `WebviewPanelSerializer`.

## Commands

- `Image Gallery: Open gallery for workspace` (`vscode-image-gallery.openGallery`): Opens the gallery for the workspace.
- `Image Gallery: Open gallery for folder` (`vscode-image-gallery.openGalleryForFolder`): Prompts for a folder or gallery scope.
- `Image Gallery: Reopen Last Gallery Tab` (`vscode-image-gallery.reopenLastGallery`): Reopens the last gallery scope. The default shortcut is `Cmd+Shift+T` on macOS or `Ctrl+Shift+T` on Windows and Linux.

You can also open the gallery for an image from the editor title menu, or choose a folder from the Explorer context menu.

## Supported Images

The gallery discovers PNG, JPG/JPEG, GIF, WebP, SVG, BMP, ICO, and AVIF assets. Generated directories such as `node_modules`, `.git`, `dist`, `out`, and `build` are excluded from workspace scans.

## Architecture

- [`src/extension.ts`](src/extension.ts): Registers commands and panel serialization.
- [`src/panels/GalleryPanel.ts`](src/panels/GalleryPanel.ts): Manages the webview, image scanning, folder scopes, live file updates, and extension messages.
- [`src/shared/types.ts`](src/shared/types.ts): Defines shared gallery models and extension/webview messages.
- [`src/webview/components/`](src/webview/components): React-style Solid components for the gallery UI.
- [`src/webview/state/`](src/webview/state): Gallery state and persistence.
- [`src/webview/utils/gallery.ts`](src/webview/utils/gallery.ts): Filtering, sorting, counting, and formatting helpers.
- [`esbuild.js`](esbuild.js): Builds the extension host and webview bundles.

## Development

```bash
# Install dependencies
npm install

# Compile extension & webview bundle
npm run compile

# Watch mode for iterative development
npm run watch

# Run type checks and linter
npm run check-types
npm run lint

# Compile and run extension-host regression tests
npm run pretest
npm run test:unit

# Create the marketplace package
npm run package
```

VS Code tests require the desktop VS Code test host. Before publishing, also verify the generated `.vsix` includes the extension icon and `dist/` bundles, and check the marketplace preview in VS Code.
