import {
  batch,
  createSignal,
  createEffect,
  Show,
  onCleanup,
  onMount,
} from "solid-js";
import { ICONS } from "../icons.js";
import { useGallery } from "../state/GalleryContext.js";
import { formatBytes, formatDate, getFileDirectory } from "../utils/gallery.js";

export function InspectorModal() {
  const { inspectingImage, filteredImages, actions } = useGallery();
  const [dimensions, setDimensions] = createSignal<{
    width: number;
    height: number;
  } | null>(null);
  const [copiedKey, setCopiedKey] = createSignal<string | null>(null);
  const [fitScale, setFitScale] = createSignal(1);
  const [zoomScale, setZoomScale] = createSignal(1);
  const [isImageReady, setIsImageReady] = createSignal(false);
  const [pan, setPan] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  let stage: HTMLDivElement | undefined;
  let dragStart:
    { x: number; y: number; panX: number; panY: number } | undefined;
  let resizeObserver: ResizeObserver | undefined;

  function calculateFitScale(dim = dimensions()) {
    if (!stage || !dim) {
      return;
    }
    const bounds = stage.getBoundingClientRect();
    const availableWidth = Math.max(1, bounds.width - 48);
    const availableHeight = Math.max(1, bounds.height - 48);
    const nextScale = Math.min(
      availableWidth / dim.width,
      availableHeight / dim.height,
      1,
    );
    setFitScale(Math.max(nextScale, 0.01));
  }

  function zoomToFit() {
    calculateFitScale();
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }

  function changeZoom(direction: 1 | -1) {
    const zoomStops = [25, 50, 75, 100, 125, 150, 200, 300, 400, 800];
    const currentPercent = fitScale() * zoomScale() * 100;
    const nextPercent =
      direction === 1
        ? zoomStops.find((percent) => percent > currentPercent)
        : zoomStops.findLast((percent) => percent < currentPercent);

    if (nextPercent === undefined) {
      return;
    }

    setZoomScale(nextPercent / 100 / fitScale());
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 1 : -1);
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      panX: pan().x,
      panY: pan().y,
    };
    setIsDragging(true);
    event.currentTarget instanceof HTMLElement &&
      event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragStart) {
      return;
    }
    setPan({
      x: dragStart.panX + event.clientX - dragStart.x,
      y: dragStart.panY + event.clientY - dragStart.y,
    });
  }

  function stopDragging() {
    dragStart = undefined;
    setIsDragging(false);
  }

  createEffect(() => {
    inspectingImage();
    setDimensions(null);
    setIsImageReady(false);
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  });

  onMount(() => {
    resizeObserver = new ResizeObserver(() => {
      const previousScale = zoomScale();
      calculateFitScale();
      if (previousScale === 1) {
        setPan({ x: 0, y: 0 });
      }
    });
    if (stage) {
      resizeObserver.observe(stage);
    }
  });

  onCleanup(() => resizeObserver?.disconnect());

  function imageStyle() {
    const dim = dimensions();
    const scale = fitScale() * zoomScale();
    return dim
      ? {
          width: `${dim.width * scale}px`,
          height: `${dim.height * scale}px`,
          transform: `translate(-50%, -50%) translate(${pan().x}px, ${pan().y}px)`,
        }
      : {};
  }

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
                  onClick={() => actions.navigateImage("prev")}
                  innerHTML={ICONS.chevronLeft}
                />
                <button
                  type="button"
                  class="btn-icon"
                  title="Next image (→)"
                  aria-label="Next image"
                  onClick={() => actions.navigateImage("next")}
                  innerHTML={ICONS.chevronRight}
                />
                <div class="toolbar-divider" aria-hidden="true" />
                <div
                  class="preview-zoom-controls"
                  aria-label="Image zoom controls"
                >
                  <button
                    type="button"
                    class="btn-icon preview-symbol-button"
                    title="Zoom out (-)"
                    aria-label="Zoom out"
                    onClick={() => changeZoom(-1)}
                  >
                    −
                  </button>
                  <span class="preview-zoom-level" title="Current image scale">
                    {Math.round(fitScale() * zoomScale() * 100)}%
                  </span>
                  <button
                    type="button"
                    class="btn-icon preview-symbol-button"
                    title="Zoom in (+)"
                    aria-label="Zoom in"
                    onClick={() => changeZoom(1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    class="btn-icon"
                    title="Zoom to fit"
                    aria-label="Zoom to fit"
                    onClick={zoomToFit}
                  >
                    Fit
                  </button>
                </div>
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
              <div
                ref={(element) => {
                  stage = element;
                  resizeObserver?.observe(element);
                }}
                class="modal-preview-stage checkerboard"
                classList={{ "is-panning": isDragging() }}
                onWheel={handleWheel}
              >
                <Show keyed when={image().id}>
                  <div class="modal-preview-image-transition">
                    <img
                      class="preview-image"
                      src={image().uri}
                      alt={image().name}
                      draggable={false}
                      style={{
                        ...imageStyle(),
                        visibility: isImageReady() ? "visible" : "hidden",
                      }}
                      onDragStart={(event) => event.preventDefault()}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={stopDragging}
                      onPointerCancel={stopDragging}
                      onLoad={(event) => {
                        const nextDimensions = {
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        };
                        batch(() => {
                          setDimensions(nextDimensions);
                          calculateFitScale(nextDimensions);
                          setZoomScale(1);
                          setPan({ x: 0, y: 0 });
                          setIsImageReady(true);
                        });
                      }}
                    />
                  </div>
                </Show>
              </div>

              <aside class="modal-sidebar">
                <Show keyed when={image().id}>
                  <div class="modal-sidebar-content">
                    <div class="meta-section">
                      <div class="section-heading">Details</div>

                      <dl class="meta-list">
                        <div class="meta-row">
                          <dt class="meta-label">File Name</dt>
                          <dd class="meta-value copyable-val">
                            <span class="text-truncate" title={image().name}>
                              {image().name}
                            </span>
                            <button
                              type="button"
                              class="btn-icon-subtle"
                              title="Copy file name"
                              aria-label="Copy file name"
                              onClick={() => handleCopy(image().name, "name")}
                              innerHTML={
                                copiedKey() === "name"
                                  ? ICONS.check
                                  : ICONS.copy
                              }
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
                            {formatBytes(image().sizeBytes)}{" "}
                          </dd>
                        </div>

                        <div class="meta-row">
                          <dt class="meta-label">Relative Path</dt>
                          <dd class="meta-value copyable-val">
                            <span class="font-mono" title={image().path}>
                              {image().path}
                            </span>
                            <button
                              type="button"
                              class="btn-icon-subtle"
                              title="Copy relative path"
                              aria-label="Copy relative path"
                              onClick={() =>
                                handleCopy(image().path, "relpath")
                              }
                              innerHTML={
                                copiedKey() === "relpath"
                                  ? ICONS.check
                                  : ICONS.copy
                              }
                            />
                          </dd>
                        </div>

                        <div class="meta-row">
                          <dt class="meta-label">Full Path</dt>
                          <dd class="meta-value copyable-val">
                            <span class="font-mono" title={image().fullPath}>
                              {image().fullPath}
                            </span>
                            <button
                              type="button"
                              class="btn-icon-subtle"
                              title="Copy full path"
                              aria-label="Copy full path"
                              onClick={() =>
                                handleCopy(image().fullPath, "fullPath", true)
                              }
                              innerHTML={
                                copiedKey() === "fullPath"
                                  ? ICONS.check
                                  : ICONS.copy
                              }
                            />
                          </dd>
                        </div>

                        <div class="meta-row">
                          <dt class="meta-label">Created</dt>
                          <dd class="meta-value">
                            {formatDate(image().createdTimestamp)}
                          </dd>
                        </div>

                        <div class="meta-row">
                          <dt class="meta-label">Modified</dt>
                          <dd class="meta-value">
                            {formatDate(image().modifiedTimestamp)}
                          </dd>
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
                    </div>
                  </div>
                </Show>
              </aside>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
