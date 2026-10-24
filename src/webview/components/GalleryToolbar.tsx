import { For, Show } from "solid-js";
import type { SortField, ViewMode } from "../../shared/types.js";
import { ICONS } from "../icons.js";
import { useGallery } from "../state/GalleryContext.js";

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "modified", label: "Date Modified" },
  { value: "extension", label: "File Type" },
];

const VIEW_MODES: { mode: ViewMode; icon: string; title: string }[] = [
  { mode: "grid", icon: ICONS.grid, title: "Grid View" },
  { mode: "compact", icon: ICONS.compact, title: "Compact Grid" },
  { mode: "list", icon: ICONS.list, title: "List View" },
];

export function GalleryToolbar() {
  const { state, extensions, actions } = useGallery();

  return (
    <header class="toolbar" role="toolbar" aria-label="Gallery Controls">
      <div class="toolbar-group toolbar-left">
        <button
          type="button"
          class="scope-btn"
          title={`Active scope: ${state().scopeLabel || "Entire Workspace"}. Click to switch folder.`}
          aria-label={`Active scope: ${state().scopeLabel || "Entire Workspace"}. Click to switch folder.`}
          onClick={actions.changeScope}
        >
          <span
            class="scope-icon"
            innerHTML={ICONS.folder}
            aria-hidden="true"
          />
          <span class="scope-text">{state().scopeLabel || "Workspace"}</span>
          <span
            class="scope-chevron"
            innerHTML={ICONS.chevronDown}
            aria-hidden="true"
          />
        </button>

        <div class="toolbar-divider" aria-hidden="true" />

        <div class="search-box">
          <span
            class="search-icon"
            innerHTML={ICONS.search}
            aria-hidden="true"
          />
          <input
            type="text"
            class="search-input"
            placeholder="Search images by name or path..."
            value={state().filter.searchQuery}
            onInput={(event) =>
              actions.setSearchQuery(event.currentTarget.value)
            }
            spellcheck={false}
          />
          <Show when={state().filter.searchQuery}>
            <button
              type="button"
              class="search-clear-btn"
              title="Clear search"
              aria-label="Clear search"
              onClick={() => actions.setSearchQuery("")}
              innerHTML={ICONS.clear}
            />
          </Show>
        </div>

        <div class="filter-pills" role="group" aria-label="Format filter">
          <button
            type="button"
            class={`pill ${state().filter.selectedExtensions.length === 0 ? "active" : ""}`}
            aria-pressed={state().filter.selectedExtensions.length === 0}
            onClick={() => actions.selectExtension("all")}
          >
            <span>All</span>
            <span class="pill-badge">{state().images.length}</span>
          </button>
          <For each={extensions().slice(0, 6)}>
            {(item) => {
              const isActive = () =>
                state().filter.selectedExtensions.includes(item.ext);
              return (
                <button
                  type="button"
                  class={`pill ${isActive() ? "active" : ""}`}
                  aria-pressed={isActive()}
                  onClick={() => actions.selectExtension(item.ext)}
                >
                  <span>{item.ext.toUpperCase()}</span>
                  <span class="pill-badge">{item.count}</span>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      <div class="toolbar-group toolbar-right">
        <div class="sort-control">
          <label class="sr-only" for="gallery-sort-select">
            Sort images by
          </label>
          <div class="select-wrapper">
            <select
              id="gallery-sort-select"
              class="sort-select"
              value={state().filter.sortField}
              onChange={(event) =>
                actions.setSortField(event.currentTarget.value as SortField)
              }
            >
              <For each={SORT_FIELDS}>
                {(field) => (
                  <option value={field.value}>Sort: {field.label}</option>
                )}
              </For>
            </select>
          </div>
          <button
            type="button"
            class="btn-icon"
            title={`Sort Order: ${state().filter.sortOrder === "asc" ? "Ascending" : "Descending"}`}
            aria-label={`Toggle sort order to ${state().filter.sortOrder === "asc" ? "descending" : "ascending"}`}
            onClick={actions.toggleSortOrder}
            innerHTML={
              state().filter.sortOrder === "asc"
                ? ICONS.sortAsc
                : ICONS.sortDesc
            }
          />
        </div>

        <div class="zoom-slider-wrapper" title="Adjust thumbnail size">
          <span class="zoom-label">Size</span>
          <input
            type="range"
            class="zoom-slider"
            min="100"
            max="450"
            step="5"
            value={state().filter.zoomLevel}
            aria-label="Thumbnail size"
            onInput={(event) =>
              actions.setZoomLevel(Number(event.currentTarget.value))
            }
          />
        </div>

        <div class="segmented-control" role="group" aria-label="View layout">
          <For each={VIEW_MODES}>
            {(view) => (
              <button
                type="button"
                class={`segmented-btn ${state().viewMode === view.mode ? "active" : ""}`}
                title={view.title}
                aria-label={view.title}
                aria-pressed={state().viewMode === view.mode}
                onClick={() => actions.setViewMode(view.mode)}
                innerHTML={view.icon}
              />
            )}
          </For>
        </div>

        <div class="toolbar-divider" aria-hidden="true" />

        <button
          type="button"
          class={`btn-icon refresh-btn ${state().isLoading ? "loading" : ""}`}
          title="Refresh workspace images"
          aria-label="Refresh workspace images"
          onClick={actions.refreshImages}
          innerHTML={ICONS.refresh}
        />
      </div>
    </header>
  );
}
