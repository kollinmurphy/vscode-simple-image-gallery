import { Show } from "solid-js";
import { useGallery } from "../state/GalleryContext.js";
import { formatBytes, getTotalSizeBytes } from "../utils/gallery.js";

export function GalleryStatusBar() {
  const { state, filteredImages } = useGallery();

  const totalCount = () => state().images.length;
  const filteredCount = () => filteredImages().length;
  const totalSize = () => formatBytes(getTotalSizeBytes(filteredImages()));
  const isFiltered = () => filteredCount() !== totalCount();

  return (
    <footer class="status-bar" role="contentinfo">
      <div class="status-section status-left">
        <span
          class="status-item status-scope"
          title={`Active scope: ${state().scopeLabel || "Entire Workspace"}`}
        >
          <span class="status-scope-label">Scope:</span>
          <span class="status-scope-val">
            {state().scopeLabel || "Workspace"}
          </span>
          <span class="status-bullet" aria-hidden="true">
            ·
          </span>
        </span>
        <span class="status-item status-count">
          <Show
            when={isFiltered()}
            fallback={
              <span>
                {totalCount()} {totalCount() === 1 ? "image" : "images"}
              </span>
            }
          >
            <span>
              {filteredCount()} of {totalCount()} images
            </span>
          </Show>
          <span class="status-bullet" aria-hidden="true">
            ·
          </span>
          <span>{totalSize()}</span>
        </span>
      </div>

      <div class="status-section status-right">
        <span class="status-hints">
          <span class="kbd">Enter</span> Inspect
          <span class="status-bullet" aria-hidden="true">
            ·
          </span>
          <span class="kbd">←</span> <span class="kbd">→</span> Navigate
          <span class="status-bullet" aria-hidden="true">
            ·
          </span>
          <span class="kbd">Esc</span> Close
        </span>
      </div>
    </footer>
  );
}
