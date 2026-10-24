export interface GalleryImage {
  id: string;
  name: string;
  path: string;
  fullPath: string;
  uri: string;
  sizeBytes: number;
  extension: string;
  modifiedTimestamp: number;
}

export type ViewMode = 'grid' | 'compact' | 'list';
export type SortField = 'name' | 'size' | 'modified' | 'extension';
export type SortOrder = 'asc' | 'desc';

export interface GalleryFilter {
  searchQuery: string;
  selectedExtensions: string[];
  sortField: SortField;
  sortOrder: SortOrder;
  zoomLevel: number;
}

export interface WebviewState {
  images: GalleryImage[];
  selectedImageId?: string;
  inspectingImageId?: string;
  filter: GalleryFilter;
  viewMode: ViewMode;
  isLoading: boolean;
  workspaceName?: string;
}

export type WebviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'openFile'; filePath: string }
  | { type: 'revealInExplorer'; filePath: string }
  | { type: 'copyToClipboard'; text: string; label?: string }
  | { type: 'showInfo'; message: string }
  | { type: 'showWarning'; message: string }
  | { type: 'showError'; message: string };

export type ExtensionToWebviewMessage =
  | { type: 'init'; payload: { workspaceName: string; images: GalleryImage[] } }
  | { type: 'setLoading'; payload: { isLoading: boolean } }
  | { type: 'setImages'; payload: { images: GalleryImage[] } }
  | { type: 'notify'; payload: { level: 'info' | 'warn' | 'error'; message: string } };

