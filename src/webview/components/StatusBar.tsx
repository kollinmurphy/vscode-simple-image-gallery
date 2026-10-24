import { Show } from 'solid-js';
import { useGallery } from '../state/GalleryContext.js';

export function StatusBar() {
  const { state, filteredImages, selectedImage } = useGallery();

  return (
    <footer class="status-bar">
      <div class="status-left">
        <span>Showing {filteredImages().length} of {state().images.length} images</span>
        <Show when={selectedImage()}>
          {(image) => <span>Selected: <strong>{image().name}</strong></span>}
        </Show>
      </div>
      <div class="status-right">
        <span>Double-click to inspect • Press Esc to close</span>
      </div>
    </footer>
  );
}
