import { Show } from 'solid-js';
import { useGallery } from '../state/GalleryContext.js';
import { EmptyState } from './EmptyState.js';
import { ImageGrid } from './ImageGrid.js';
import { ImageList } from './ImageList.js';

export function GalleryContent() {
  const { state, filteredImages } = useGallery();

  return (
    <main class="content-area" aria-live="polite">
      <Show
        when={!state().isLoading}
        fallback={
          <div class="state-container" role="status">
            <div class="spinner" aria-hidden="true"></div>
            <div class="state-title">Scanning Workspace for Images...</div>
            <div class="state-desc">Searching for PNG, JPG, WebP, SVG, GIF, and other graphics.</div>
          </div>
        }
      >
        <Show when={filteredImages().length > 0} fallback={<EmptyState />}>
          <Show when={state().viewMode === 'list'} fallback={<ImageGrid images={filteredImages()} />}>
            <ImageList images={filteredImages()} />
          </Show>
        </Show>
      </Show>
    </main>
  );
}
