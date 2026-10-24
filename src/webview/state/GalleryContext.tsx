import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import type { Accessor, ParentProps } from "solid-js";
import type {
  ExtensionToWebviewMessage,
  GalleryFilter,
  GalleryImage,
  SortField,
  ViewMode,
  WebviewState,
  WebviewToExtensionMessage,
} from "../../shared/types.js";
import { countExtensions, filterImages } from "../utils/gallery.js";
import type { ExtensionCount } from "../utils/gallery.js";

declare function acquireVsCodeApi<T = unknown>(): {
  postMessage(message: unknown): void;
  getState(): T | undefined;
  setState(state: T): T;
};

const vscode = acquireVsCodeApi<WebviewState>();
const DEFAULT_FILTER: GalleryFilter = {
  searchQuery: "",
  selectedExtensions: [],
  sortField: "name",
  sortOrder: "asc",
  zoomLevel: 275,
};

export interface GalleryActions {
  refreshImages(): void;
  resetFilters(): void;
  setSearchQuery(query: string): void;
  selectExtension(extension: string): void;
  setSortField(field: SortField): void;
  toggleSortOrder(): void;
  setZoomLevel(level: number): void;
  setViewMode(mode: ViewMode): void;
  inspectImage(imageId: string): void;
  closeInspector(): void;
  openImage(image: GalleryImage): void;
  revealImage(image: GalleryImage): void;
  copyPath(path: string): void;
  copyFullPath(path: string): void;
  navigateImage(direction: "prev" | "next"): void;
  changeScope(): void;
}

export interface GalleryContextValue {
  state: Accessor<WebviewState>;
  filteredImages: Accessor<GalleryImage[]>;
  extensions: Accessor<ExtensionCount[]>;
  inspectingImage: Accessor<GalleryImage | undefined>;
  actions: GalleryActions;
}

const GalleryContext = createContext<GalleryContextValue>();

export function GalleryProvider(props: ParentProps) {
  const [state, setStateSignal] = createSignal<WebviewState>(
    vscode.getState() ?? {
      images: [],
      filter: DEFAULT_FILTER,
      viewMode: "grid",
      isLoading: true,
      workspaceName: "Workspace",
      scopeLabel: "Entire Workspace",
    },
  );

  function updateState(
    updater:
      | Partial<WebviewState>
      | ((previous: WebviewState) => Partial<WebviewState>),
  ) {
    setStateSignal((previous) => {
      const partial =
        typeof updater === "function" ? updater(previous) : updater;
      const next = { ...previous, ...partial };
      vscode.setState(next);
      return next;
    });
  }

  function postMessage(message: WebviewToExtensionMessage) {
    vscode.postMessage(message);
  }

  const filteredImages = createMemo(() =>
    filterImages(state().images, state().filter),
  );
  const extensions = createMemo(() => countExtensions(state().images));
  const inspectingImage = createMemo(() =>
    state().images.find((image) => image.id === state().inspectingImageId),
  );

  const actions: GalleryActions = {
    refreshImages() {
      updateState({ isLoading: true });
      postMessage({ type: "refresh" });
    },
    resetFilters() {
      updateState((previous) => ({
        filter: { ...previous.filter, searchQuery: "", selectedExtensions: [] },
      }));
    },
    setSearchQuery(query) {
      updateState((previous) => ({
        filter: { ...previous.filter, searchQuery: query },
      }));
    },
    selectExtension(extension) {
      updateState((previous) => {
        if (extension === "all") {
          return { filter: { ...previous.filter, selectedExtensions: [] } };
        }
        const selectedExtensions = previous.filter.selectedExtensions;
        return {
          filter: {
            ...previous.filter,
            selectedExtensions: selectedExtensions.includes(extension)
              ? selectedExtensions.filter((item) => item !== extension)
              : [...selectedExtensions, extension],
          },
        };
      });
    },
    setSortField(field) {
      updateState((previous) => ({
        filter: { ...previous.filter, sortField: field },
      }));
    },
    toggleSortOrder() {
      updateState((previous) => ({
        filter: {
          ...previous.filter,
          sortOrder: previous.filter.sortOrder === "asc" ? "desc" : "asc",
        },
      }));
    },
    setZoomLevel(level) {
      updateState((previous) => ({
        filter: { ...previous.filter, zoomLevel: level },
      }));
    },
    setViewMode(mode) {
      updateState((previous) => ({
        viewMode: mode,
        filter: {
          ...previous.filter,
          zoomLevel:
            mode === "compact"
              ? 100
              : mode === "grid"
                ? 275
                : previous.filter.zoomLevel,
        },
      }));
    },
    inspectImage(imageId) {
      updateState({ inspectingImageId: imageId });
    },
    closeInspector() {
      updateState({ inspectingImageId: undefined });
    },
    openImage(image) {
      postMessage({ type: "openFile", filePath: image.fullPath });
    },
    revealImage(image) {
      postMessage({ type: "revealInExplorer", filePath: image.fullPath });
    },
    copyPath(path) {
      postMessage({
        type: "copyToClipboard",
        text: path,
        label: "relative path",
      });
    },
    copyFullPath(path) {
      postMessage({ type: "copyToClipboard", text: path, label: "full path" });
    },
    navigateImage(direction) {
      const images = filteredImages();
      if (images.length === 0) {
        return;
      }
      const currentId = state().inspectingImageId;
      const currentIndex = images.findIndex((image) => image.id === currentId);
      const nextIndex =
        direction === "next"
          ? currentIndex >= 0
            ? (currentIndex + 1) % images.length
            : 0
          : currentIndex > 0
            ? currentIndex - 1
            : images.length - 1;
      const nextImage = images[nextIndex];
      if (nextImage) {
        updateState({ inspectingImageId: nextImage.id });
      }
    },
    changeScope() {
      postMessage({ type: "changeScope" });
    },
  };

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (state().inspectingImageId) {
        actions.closeInspector();
      }
      return;
    }

    if (event.key === "ArrowRight") {
      actions.navigateImage("next");
      return;
    }
    if (event.key === "ArrowLeft") {
      actions.navigateImage("prev");
      return;
    }
  }

  function handleMessage(event: MessageEvent) {
    const message = event.data as ExtensionToWebviewMessage;
    switch (message.type) {
      case "init":
        updateState({
          workspaceName: message.payload.workspaceName,
          images: message.payload.images,
          scopeLabel: message.payload.scopeLabel,
          isLoading: false,
        });
        break;
      case "setLoading":
        updateState({ isLoading: message.payload.isLoading });
        break;
      case "setImages":
        updateState({ images: message.payload.images, isLoading: false });
        break;
      case "setScope":
        updateState({
          scopeLabel: message.payload.scopeLabel,
          images: message.payload.images,
          isLoading: false,
          inspectingImageId: undefined,
        });
        break;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("message", handleMessage);
    postMessage({ type: "ready" });
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("message", handleMessage);
  });

  const value: GalleryContextValue = {
    state,
    filteredImages,
    extensions,
    inspectingImage,
    actions,
  };

  return (
    <GalleryContext.Provider value={value}>
      {props.children}
    </GalleryContext.Provider>
  );
}

export function useGallery(): GalleryContextValue {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error("useGallery must be used inside GalleryProvider");
  }
  return context;
}
