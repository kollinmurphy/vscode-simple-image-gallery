import { For } from 'solid-js';
import type { GalleryImage } from '../../shared/types.js';
import { ICONS } from '../icons.js';
import { formatBytes } from '../utils/gallery.js';
import { useGallery } from '../state/GalleryContext.js';

interface ImageGridProps {
  images: GalleryImage[];
}

export function ImageGrid(props: ImageGridProps) {
  const { state, actions } = useGallery();

  return (
    <div
      class={`image-grid ${state().viewMode === 'compact' ? 'compact' : ''}`}
      role="grid"
      aria-label="Image gallery"
    >
      <For each={props.images}>
        {(image) => {
          const isSelected = () => image.id === state().selectedImageId;

          return (
            <div
              class={`gallery-card ${isSelected() ? 'selected' : ''}`}
              role="gridcell"
              tabIndex={0}
              aria-selected={isSelected()}
              aria-label={`${image.name}, ${formatBytes(image.sizeBytes)}`}
              onClick={() => actions.selectImage(image.id)}
              onDblClick={() => actions.inspectImage(image.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  actions.inspectImage(image.id);
                }
              }}
            >
              <div class="card-preview checkerboard">
                <img
                  src={image.uri}
                  alt={image.name}
                  loading="lazy"
                  decoding="async"
                />

                <div class="card-overlay" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    class="card-overlay-btn"
                    title="Open in Editor"
                    aria-label={`Open ${image.name} in Editor`}
                    onClick={() => actions.openImage(image)}
                    innerHTML={ICONS.external}
                  />
                  <button
                    type="button"
                    class="card-overlay-btn"
                    title="Copy Path"
                    aria-label={`Copy path of ${image.name}`}
                    onClick={() => actions.copyPath(image.path)}
                    innerHTML={ICONS.copy}
                  />
                </div>
              </div>

              <div class="card-info">
                <div class="card-name" title={image.name}>
                  {image.name}
                </div>
                <div class="card-meta">
                  <span class="card-size">{formatBytes(image.sizeBytes)}</span>
                </div>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
