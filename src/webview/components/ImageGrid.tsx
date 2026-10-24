import { For } from "solid-js";
import type { GalleryImage } from "../../shared/types.js";
import { ICONS } from "../icons.js";
import { formatBytes, getFileDirectory } from "../utils/gallery.js";
import { useGallery } from "../state/GalleryContext.js";

interface ImageGridProps {
  images: GalleryImage[];
}

export function ImageGrid(props: ImageGridProps) {
  const { state, actions } = useGallery();

  return (
    <div
      class={`image-grid ${state().viewMode === "compact" ? "compact" : ""}`}
      role="grid"
      aria-label="Image gallery"
    >
      <For each={props.images}>
        {(image) => {
          const directory = getFileDirectory(image.path);

          return (
            <div
              class="gallery-card"
              role="gridcell"
              aria-label={`${image.name}, ${formatBytes(image.sizeBytes)}`}
              onClick={() => actions.inspectImage(image.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  actions.inspectImage(image.id);
                }
              }}
            >
              <div class="card-preview">
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
                    onClick={() => actions.copyFullPath(image.fullPath)}
                    innerHTML={ICONS.copy}
                  />
                </div>
              </div>

              <div class="card-info">
                <span class="card-name">
                  <span
                    class="card-path"
                    title={directory === "./" ? "Workspace root" : directory}
                    aria-label={
                      directory === "./" ? "Workspace root" : directory
                    }
                  >
                    {directory !== "./" ? `${directory}/` : "Root"}
                  </span>
                  <span class="card-filename" title={image.name}>
                    {image.name}
                  </span>
                </span>
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
