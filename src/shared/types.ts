export interface GalleryImage {
  id: string;
  name: string;
  path: string;
  fullPath: string;
  uri: string;
  sizeBytes: number;
  extension: string;
  modifiedTimestamp: number;
  createdTimestamp: number;
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
  inspectingImageId?: string;
  filter: GalleryFilter;
  viewMode: ViewMode;
  isLoading: boolean;
  workspaceName?: string;
  scopeLabel?: string;
}

export type WebviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'changeScope' }
  | { type: 'openFile'; filePath: string }
  | { type: 'revealInExplorer'; filePath: string }
  | { type: 'copyToClipboard'; text: string; label?: string }
  | { type: 'showInfo'; message: string }
  | { type: 'showWarning'; message: string }
  | { type: 'showError'; message: string };

export type ExtensionToWebviewMessage =
  | { type: 'init'; payload: { workspaceName: string; images: GalleryImage[]; scopeLabel?: string } }
  | { type: 'setLoading'; payload: { isLoading: boolean } }
  | { type: 'setImages'; payload: { images: GalleryImage[] } }
  | { type: 'setScope'; payload: { scopeLabel: string; images: GalleryImage[] } }
  | { type: 'notify'; payload: { level: 'info' | 'warn' | 'error'; message: string } };
