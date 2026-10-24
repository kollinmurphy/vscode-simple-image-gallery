import { For } from "solid-js";
import type { GalleryImage } from "../../shared/types.js";
import { ICONS } from "../icons.js";
import { formatBytes, formatDate, getFileDirectory } from "../utils/gallery.js";
import { useGallery } from "../state/GalleryContext.js";

interface ImageListProps {
  images: GalleryImage[];
}

export function ImageList(props: ImageListProps) {
  const { state, actions } = useGallery();

  return (
    <div class="image-list-table" role="table" aria-label="Image files list">
      <div class="list-header" role="row">
        <span class="col-thumb" role="columnheader">
          Preview
        </span>
        <span class="col-name" role="columnheader">
          Name
        </span>
        <span class="col-path" role="columnheader">
          Directory
        </span>
        <span class="col-ext" role="columnheader">
          Type
        </span>
        <span class="col-size" role="columnheader">
          Size
        </span>
        <span class="col-date" role="columnheader">
          Modified
        </span>
        <span class="col-actions" role="columnheader">
          Actions
        </span>
      </div>

      <div class="list-body" role="rowgroup">
        <For each={props.images}>
          {(image) => (
            <div
              class="list-row"
              role="row"
              tabIndex={0}
              onClick={() => actions.inspectImage(image.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  actions.inspectImage(image.id);
                }
              }}
            >
              <div class="col-thumb" role="cell">
                <div class="list-thumb checkerboard">
                  <img
                    src={image.uri}
                    alt={image.name}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              <div class="col-name" role="cell" title={image.name}>
                <span class="list-filename">{image.name}</span>
              </div>

              <div class="col-path" role="cell" title={image.path}>
                <span class="list-filepath">
                  {getFileDirectory(image.path)}
                </span>
              </div>

              <div class="col-ext" role="cell">
                <span class="format-badge">
                  {image.extension.toUpperCase()}
                </span>
              </div>

              <div class="col-size" role="cell">
                <span>{formatBytes(image.sizeBytes)}</span>
              </div>

              <div class="col-date" role="cell">
                <span>{formatDate(image.modifiedTimestamp)}</span>
              </div>

              <div class="col-actions" role="cell">
                <div class="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    class="btn-icon-subtle"
                    title="Open in VS Code"
                    aria-label={`Open ${image.name} in VS Code`}
                    onClick={() => actions.openImage(image)}
                    innerHTML={ICONS.external}
                  />
                  <button
                    type="button"
                    class="btn-icon-subtle"
                    title="Copy Relative Path"
                    aria-label={`Copy path for ${image.name}`}
                    onClick={() => actions.copyPath(image.path)}
                    innerHTML={ICONS.copy}
                  />
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
