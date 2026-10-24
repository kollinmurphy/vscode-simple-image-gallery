import { Show } from 'solid-js';
import { ICONS } from '../icons.js';
import { useGallery } from '../state/GalleryContext.js';

export function EmptyState() {
  const { state, actions } = useGallery();
  const hasFilters = () =>
    Boolean(state().filter.searchQuery) || state().filter.selectedExtensions.length > 0;

  return (
    <div class="state-container">
      <div class="state-icon" innerHTML={ICONS.gallery}></div>
      <div class="state-title">
        {state().images.length === 0 ? 'No Images Found' : 'No Matching Images'}
      </div>
      <div class="state-desc">
        {state().images.length === 0
          ? 'Add images to your workspace or click Refresh to rescan.'
          : 'Try clearing your search query or selecting a different filter.'}
      </div>
      <Show when={hasFilters()} fallback={
        <button class="btn btn-primary" onClick={actions.refreshImages}>
          <span innerHTML={ICONS.refresh}></span> Scan Again
        </button>
      }>
        <button class="btn btn-secondary" onClick={actions.resetFilters}>Reset Filters</button>
      </Show>
    </div>
  );
}
