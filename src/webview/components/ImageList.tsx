import { For } from 'solid-js';
import type { GalleryImage } from '../../shared/types.js';
import { ICONS } from '../icons.js';
import { formatBytes, formatDate } from '../utils/gallery.js';
import { useGallery } from '../state/GalleryContext.js';

interface ImageListProps {
  images: GalleryImage[];
}

export function ImageList(props: ImageListProps) {
  const { state, actions } = useGallery();

  return (
    <div class="image-list">
      <For each={props.images}>
        {(image) => (
          <div
            class={`list-row ${image.id === state().selectedImageId ? 'selected' : ''}`}
            onClick={() => actions.selectImage(image.id)}
            onDblClick={() => actions.inspectImage(image.id)}
          >
            <div class="list-thumb checkerboard">
              <img src={image.uri} alt={image.name} loading="lazy" />
            </div>
            <div class="list-name" title={image.name}>{image.name}</div>
            <div class="list-path" title={image.path}>{image.path}</div>
            <div class="list-size">{formatBytes(image.sizeBytes)}</div>
            <div class="list-date">{formatDate(image.modifiedTimestamp)}</div>
            <div class="list-actions">
              <button
                class="btn-icon btn-action-open"
                title="Open in VS Code Editor"
                aria-label={`Open ${image.name} in VS Code Editor`}
                onClick={(event) => {
                  event.stopPropagation();
                  actions.openImage(image);
                }}
              ><span innerHTML={ICONS.external}></span></button>
              <button
                class="btn-icon btn-action-copy"
                title="Copy Relative Path"
                aria-label={`Copy path for ${image.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  actions.copyPath(image.path);
                }}
              ><span innerHTML={ICONS.copy}></span></button>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
