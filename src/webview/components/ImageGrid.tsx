import { For } from 'solid-js';
import type { GalleryImage } from '../../shared/types.js';
import { formatBytes } from '../utils/gallery.js';
import { useGallery } from '../state/GalleryContext.js';

interface ImageGridProps {
  images: GalleryImage[];
}

export function ImageGrid(props: ImageGridProps) {
  const { state, actions } = useGallery();

  return (
    <div class={`image-grid ${state().viewMode === 'compact' ? 'compact' : ''}`}>
      <For each={props.images}>
        {(image) => (
          <div
            class={`gallery-card ${image.id === state().selectedImageId ? 'selected' : ''}`}
            title={`${image.path} (${formatBytes(image.sizeBytes)})`}
            onClick={() => actions.selectImage(image.id)}
            onDblClick={() => actions.inspectImage(image.id)}
          >
            <div class="card-preview checkerboard">
              <img src={image.uri} alt={image.name} loading="lazy" />
            </div>
            <div class="card-info">
              <div class="card-name">{image.name}</div>
              <div class="card-meta">
                <span>{formatBytes(image.sizeBytes)}</span>
                <span class="card-badge">{image.extension}</span>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
