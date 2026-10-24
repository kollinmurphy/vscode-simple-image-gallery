import { Show } from 'solid-js';
import { ICONS } from '../icons.js';
import { useGallery } from '../state/GalleryContext.js';
import { formatBytes, formatDate } from '../utils/gallery.js';

export function InspectorModal() {
  const { inspectingImage, actions } = useGallery();

  return (
    <Show when={inspectingImage()}>
      {(image) => (
        <div
          class="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              actions.closeInspector();
            }
          }}
        >
          <section class="modal-content" role="dialog" aria-modal="true" aria-label={`Image details: ${image().name}`}>
            <header class="modal-header">
              <div class="modal-title" title={image().name}>{image().name}</div>
              <button
                class="btn-icon"
                title="Close (Esc)"
                aria-label="Close image details"
                onClick={actions.closeInspector}
                innerHTML={ICONS.close}
              />
            </header>
            <div class="modal-body">
              <div class="modal-preview checkerboard">
                <img src={image().uri} alt={image().name} />
              </div>
              <div class="modal-sidebar">
                <div class="meta-group">
                  <div class="meta-item"><span class="meta-label">File Name</span><span class="meta-value">{image().name}</span></div>
                  <div class="meta-item"><span class="meta-label">Relative Path</span><span class="meta-value">{image().path}</span></div>
                  <div class="meta-item"><span class="meta-label">File Size</span><span class="meta-value">{formatBytes(image().sizeBytes)} ({image().sizeBytes.toLocaleString()} bytes)</span></div>
                  <div class="meta-item"><span class="meta-label">Format</span><span class="meta-value">{image().extension.toUpperCase()}</span></div>
                  <div class="meta-item"><span class="meta-label">Last Modified</span><span class="meta-value">{formatDate(image().modifiedTimestamp)}</span></div>
                </div>
                <div class="modal-actions">
                  <button class="btn btn-primary" onClick={() => actions.openImage(image())}>
                    <span innerHTML={ICONS.external}></span><span>Open in VS Code</span>
                  </button>
                  <button class="btn btn-secondary" onClick={() => actions.revealImage(image())}>
                    <span innerHTML={ICONS.folder}></span><span>Reveal in System Explorer</span>
                  </button>
                  <button class="btn btn-secondary" onClick={() => actions.copyPath(image().path)}>
                    <span innerHTML={ICONS.copy}></span><span>Copy Relative Path</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </Show>
  );
}
