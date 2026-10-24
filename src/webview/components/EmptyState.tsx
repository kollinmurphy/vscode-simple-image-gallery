import { Show } from 'solid-js';
import { ICONS } from '../icons.js';
import { useGallery } from '../state/GalleryContext.js';

export function EmptyState() {
  const { state, actions } = useGallery();
  const hasFilters = () =>
    Boolean(state().filter.searchQuery) || state().filter.selectedExtensions.length > 0;

  return (
    <div class="empty-state-view" role="status">
      <div class="empty-icon-wrap" aria-hidden="true" innerHTML={hasFilters() ? ICONS.filter : ICONS.gallery} />

      <h2 class="empty-title">
        {state().images.length === 0 ? 'No images found in workspace' : 'No images match criteria'}
      </h2>

      <p class="empty-desc">
        {state().images.length === 0
          ? 'Add PNG, JPG, WebP, SVG, GIF, BMP, or AVIF files to your workspace, or rescan.'
          : 'Try searching with a different keyword or resetting your format filters.'}
      </p>

      <div class="empty-actions">
        <Show
          when={hasFilters()}
          fallback={
            <button type="button" class="btn btn-secondary" onClick={actions.refreshImages}>
              <span class="btn-icon-svg" innerHTML={ICONS.refresh} />
              <span>Rescan Workspace</span>
            </button>
          }
        >
          <button type="button" class="btn btn-secondary" onClick={actions.resetFilters}>
            <span>Reset Active Filters</span>
          </button>
        </Show>
      </div>
    </div>
  );
}
