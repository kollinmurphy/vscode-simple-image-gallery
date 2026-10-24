import { ICONS } from '../icons.js';
import { useGallery } from '../state/GalleryContext.js';

export function GalleryHeader() {
  const { state, actions } = useGallery();

  return (
    <header class="header">
      <div class="header-left">
        <div class="header-title">
          <span innerHTML={ICONS.gallery}></span>
          <span>Image Gallery</span>
        </div>
        <span class="workspace-badge">{state().workspaceName || 'Workspace'}</span>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          title="Rescan Workspace Images"
          onClick={actions.refreshImages}
        >
          <span innerHTML={ICONS.refresh}></span>
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}
