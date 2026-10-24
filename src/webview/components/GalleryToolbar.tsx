import { For, Show } from 'solid-js';
import type { SortField, ViewMode } from '../../shared/types.js';
import { ICONS } from '../icons.js';
import { useGallery } from '../state/GalleryContext.js';

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Sort by Name' },
  { value: 'size', label: 'Sort by Size' },
  { value: 'modified', label: 'Sort by Date' },
  { value: 'extension', label: 'Sort by Type' },
];

const VIEW_MODES: { mode: ViewMode; icon: string; title: string }[] = [
  { mode: 'grid', icon: ICONS.grid, title: 'Grid View' },
  { mode: 'compact', icon: ICONS.compact, title: 'Compact View' },
  { mode: 'list', icon: ICONS.list, title: 'List View' },
];

export function GalleryToolbar() {
  const { state, extensions, actions } = useGallery();

  return (
    <section class="toolbar">
      <div class="toolbar-section">
        <div class="search-wrapper">
          <span class="search-icon" innerHTML={ICONS.search}></span>
          <input
            type="search"
            class="search-input"
            placeholder="Search images..."
            value={state().filter.searchQuery}
            onInput={(event) => actions.setSearchQuery(event.currentTarget.value)}
          />
          <Show when={state().filter.searchQuery}>
            <button
              class="search-clear"
              title="Clear search"
              aria-label="Clear search"
              onClick={() => actions.setSearchQuery('')}
              innerHTML={ICONS.clear}
            />
          </Show>
        </div>
        <div class="filter-chips">
          <button
            class={`chip ${state().filter.selectedExtensions.length === 0 ? 'active' : ''}`}
            aria-pressed={state().filter.selectedExtensions.length === 0}
            onClick={() => actions.selectExtension('all')}
          >
            All <span class="chip-count">{state().images.length}</span>
          </button>
          <For each={extensions().slice(0, 5)}>
            {(item) => {
              const isActive = () => state().filter.selectedExtensions.includes(item.ext);
              return (
                <button
                  class={`chip ${isActive() ? 'active' : ''}`}
                  aria-pressed={isActive()}
                  onClick={() => actions.selectExtension(item.ext)}
                >
                  {item.ext.toUpperCase()} <span class="chip-count">{item.count}</span>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      <div class="toolbar-section">
        <select
          class="select-input"
          aria-label="Sort images"
          value={state().filter.sortField}
          onChange={(event) => actions.setSortField(event.currentTarget.value as SortField)}
        >
          <For each={SORT_FIELDS}>
            {(field) => <option value={field.value}>{field.label}</option>}
          </For>
        </select>
        <button
          class="btn-icon"
          title={`Toggle Sort Direction (${state().filter.sortOrder.toUpperCase()})`}
          aria-label={`Sort ${state().filter.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          onClick={actions.toggleSortOrder}
        >
          <span>{state().filter.sortOrder === 'asc' ? '▲' : '▼'}</span>
        </button>

        <Show when={state().viewMode === 'grid'}>
          <label class="zoom-control" title="Adjust thumbnail size">
            <span>Zoom</span>
            <input
              type="range"
              class="zoom-slider"
              min="120"
              max="320"
              value={state().filter.zoomLevel}
              aria-label="Thumbnail size"
              onInput={(event) => actions.setZoomLevel(Number(event.currentTarget.value))}
            />
          </label>
        </Show>

        <div class="view-mode-group" role="group" aria-label="Gallery view">
          <For each={VIEW_MODES}>
            {(view) => (
              <button
                class={`btn-icon ${state().viewMode === view.mode ? 'active' : ''}`}
                title={view.title}
                aria-label={view.title}
                aria-pressed={state().viewMode === view.mode}
                onClick={() => actions.setViewMode(view.mode)}
                innerHTML={view.icon}
              />
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
