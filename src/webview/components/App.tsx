import { InspectorModal } from './InspectorModal.js';
import { GalleryContent } from './GalleryContent.js';
import { GalleryToolbar } from './GalleryToolbar.js';
import { GalleryStatusBar } from './GalleryStatusBar.js';
import { useGallery } from '../state/GalleryContext.js';

export function App() {
  const { state } = useGallery();

  return (
    <div
      class="app-container"
      style={`--card-width: ${state().filter.zoomLevel}px`}
    >
      <GalleryToolbar />
      <GalleryContent />
      <GalleryStatusBar />
      <InspectorModal />
    </div>
  );
}
