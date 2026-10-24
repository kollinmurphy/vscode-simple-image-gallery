import { createSignal, createEffect, Show } from 'solid-js';
import { ICONS } from '../icons.js';
import { useGallery } from '../state/GalleryContext.js';
import { formatBytes, formatDate, getFileDirectory } from '../utils/gallery.js';

export function InspectorModal() {
  const { inspectingImage, filteredImages, actions } = useGallery();
  const [dimensions, setDimensions] = createSignal<{ width: number; height: number } | null>(null);
  const [copiedKey, setCopiedKey] = createSignal<string | null>(null);

  // Reset dimensions when the inspecting image changes
  createEffect(() => {
    inspectingImage();
    setDimensions(null);
  });

  function handleCopy(text: string, key: string, isFull = false) {
    if (isFull) {
      actions.copyFullPath(text);
    } else {
      actions.copyPath(text);
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1800);
  }

  const currentIndex = () => {
    const img = inspectingImage();
    if (!img) {
      return -1;
    }
    return filteredImages().findIndex((item) => item.id === img.id);
  };

  const totalCount = () => filteredImages().length;

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
          <div
            class="modal-window"
            role="dialog"
            aria-modal="true"
            aria-label={`Image inspector: ${image().name}`}
          >
            <header class="modal-header">
              <div class="modal-title-group">
                <span class="format-badge">{image().extension.toUpperCase()}</span>
                <span class="modal-title" title={image().name}>
                  {image().name}
                </span>
                <Show when={currentIndex() >= 0 && totalCount() > 0}>
                  <span class="modal-counter">
                    {currentIndex() + 1} of {totalCount()}
                  </span>
                </Show>
              </div>

              <div class="modal-header-actions">
                <button
                  type="button"
                  class="btn-icon"
                  title="Previous image (←)"
                  aria-label="Previous image"
                  onClick={() => actions.navigateImage('prev')}
                  innerHTML={ICONS.chevronLeft}
                />
                <button
                  type="button"
                  class="btn-icon"
                  title="Next image (→)"
                  aria-label="Next image"
                  onClick={() => actions.navigateImage('next')}
                  innerHTML={ICONS.chevronRight}
                />
                <div class="toolbar-divider" aria-hidden="true" />
                <button
                  type="button"
                  class="btn-icon close-btn"
                  title="Close inspector (Esc)"
                  aria-label="Close inspector"
                  onClick={actions.closeInspector}
                  innerHTML={ICONS.close}
                />
              </div>
            </header>

            <div class="modal-body">
              <div class="modal-preview-stage checkerboard">
                <img
                  src={image().uri}
                  alt={image().name}
                  onLoad={(e) => {
                    setDimensions({
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    });
                  }}
                />

                <Show when={dimensions()}>
                  {(dim) => (
                    <div class="preview-dim-badge">
                      {dim().width} × {dim().height} px
                    </div>
                  )}
                </Show>
              </div>

              <aside class="modal-sidebar">
                <div class="meta-section">
                  <div class="section-heading">Details</div>

                  <dl class="meta-list">
                    <div class="meta-row">
                      <dt class="meta-label">File Name</dt>
                      <dd class="meta-value copyable-val">
                        <span class="text-truncate" title={image().name}>{image().name}</span>
                        <button
                          type="button"
                          class="btn-icon-subtle"
                          title="Copy file name"
                          aria-label="Copy file name"
                          onClick={() => handleCopy(image().name, 'name')}
                          innerHTML={copiedKey() === 'name' ? ICONS.check : ICONS.copy}
                        />
                      </dd>
                    </div>

                    <Show when={dimensions()}>
                      {(dim) => (
                        <div class="meta-row">
                          <dt class="meta-label">Dimensions</dt>
                          <dd class="meta-value font-mono">
                            {dim().width} × {dim().height} px
                          </dd>
                        </div>
                      )}
                    </Show>

                    <div class="meta-row">
                      <dt class="meta-label">File Size</dt>
                      <dd class="meta-value">
                        {formatBytes(image().sizeBytes)}{' '}
                      </dd>
                    </div>

                    <div class="meta-row">
                      <dt class="meta-label">Format</dt>
                      <dd class="meta-value">
                        <span class="format-badge">{image().extension.toUpperCase()}</span>
                      </dd>
                    </div>

                    <div class="meta-row">
                      <dt class="meta-label">Folder</dt>
                      <dd class="meta-value text-truncate" title={getFileDirectory(image().path)}>
                        {getFileDirectory(image().path)}
                      </dd>
                    </div>

                    <div class="meta-row">
                      <dt class="meta-label">Relative Path</dt>
                      <dd class="meta-value copyable-val">
                        <span class="text-truncate font-mono" title={image().path}>{image().path}</span>
                        <button
                          type="button"
                          class="btn-icon-subtle"
                          title="Copy relative path"
                          aria-label="Copy relative path"
                          onClick={() => handleCopy(image().path, 'relpath')}
                          innerHTML={copiedKey() === 'relpath' ? ICONS.check : ICONS.copy}
                        />
                      </dd>
                    </div>

                    <div class="meta-row">
                      <dt class="meta-label">Modified</dt>
                      <dd class="meta-value">{formatDate(image().modifiedTimestamp)}</dd>
                    </div>
                  </dl>
                </div>

                <div class="modal-actions">
                  <button
                    type="button"
                    class="btn btn-primary"
                    onClick={() => actions.openImage(image())}
                  >
                    <span class="btn-icon-svg" innerHTML={ICONS.external} />
                    <span>Open in VS Code</span>
                  </button>

                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => actions.revealImage(image())}
                  >
                    <span class="btn-icon-svg" innerHTML={ICONS.folder} />
                    <span>Reveal in Explorer</span>
                  </button>

                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => handleCopy(image().path, 'btn-relpath')}
                  >
                    <span
                      class="btn-icon-svg"
                      innerHTML={copiedKey() === 'btn-relpath' ? ICONS.check : ICONS.copy}
                    />
                    <span>{copiedKey() === 'btn-relpath' ? 'Copied Path!' : 'Copy Relative Path'}</span>
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
