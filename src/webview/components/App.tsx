import { InspectorModal } from './InspectorModal.js';
import { GalleryContent } from './GalleryContent.js';
import { GalleryHeader } from './GalleryHeader.js';
import { GalleryToolbar } from './GalleryToolbar.js';
import { StatusBar } from './StatusBar.js';
import { useGallery } from '../state/GalleryContext.js';

export function App() {
  const { state } = useGallery();

  return (
    <div class="app-container" style={`--card-width: ${state().filter.zoomLevel}px`}>
      <GalleryHeader />
      <GalleryToolbar />
      <GalleryContent />
      <StatusBar />
      <InspectorModal />
    </div>
  );
}
