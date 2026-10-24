import { Show } from 'solid-js';
import { useGallery } from '../state/GalleryContext.js';
import { EmptyState } from './EmptyState.js';
import { ImageGrid } from './ImageGrid.js';
import { ImageList } from './ImageList.js';

export function GalleryContent() {
  const { state, filteredImages } = useGallery();

  return (
    <main class="content-area">
      <Show
        when={!state().isLoading}
        fallback={
          <div class="empty-state-view" role="status">
            <div class="spinner" aria-hidden="true" />
            <h2 class="empty-title">Scanning workspace...</h2>
            <p class="empty-desc">Discovering image files in current folders</p>
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
