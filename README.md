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

- `Image Gallery: Open Image Gallery` (`vscode-image-gallery.openGallery`): Opens the Image Gallery web GUI editor panel.

## Architecture & Extensibility

- **Extension Host**:
  - [`src/extension.ts`](file:///Users/kollinmurphy/development/projects/vscode-image-gallery/src/extension.ts): Entrypoint registering commands and panel serializers.
  - [`src/panels/GalleryPanel.ts`](file:///Users/kollinmurphy/development/projects/vscode-image-gallery/src/panels/GalleryPanel.ts): Webview panel manager, file scanner, live file watcher, CSP configuration, and messaging host.
- **Shared Types**:
  - [`src/shared/types.ts`](file:///Users/kollinmurphy/development/projects/vscode-image-gallery/src/shared/types.ts): Strongly typed message bus and data models.
- **Webview GUI**:
  - [`src/webview/main.ts`](file:///Users/kollinmurphy/development/projects/vscode-image-gallery/src/webview/main.ts): Webview application logic, state persistence, keyboard navigation, and event handling.
  - [`src/webview/styles.css`](file:///Users/kollinmurphy/development/projects/vscode-image-gallery/src/webview/styles.css): VS Code theme-aware styling leveraging CSS variables.
- **Build System**:
  - [`esbuild.js`](file:///Users/kollinmurphy/development/projects/vscode-image-gallery/esbuild.js): Bundles both Node.js extension host and browser webview assets (`dist/extension.js`, `dist/webview.js`, `dist/webview.css`).

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
```
