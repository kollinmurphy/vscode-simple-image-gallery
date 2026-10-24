import { InspectorModal } from "./InspectorModal.js";
import { GalleryContent } from "./GalleryContent.js";
import { GalleryToolbar } from "./GalleryToolbar.js";
import { GalleryStatusBar } from "./GalleryStatusBar.js";
import { useGallery } from "../state/GalleryContext.js";

export function App() {
  const { state } = useGallery();
  const listThumbSize = () =>
    Math.min(112, Math.max(36, Math.round(state().filter.zoomLevel / 4)));

  return (
    <div
      class="app-container"
      style={`--card-width: ${state().filter.zoomLevel}px; --list-thumb-size: ${listThumbSize()}px`}
    >
      <GalleryToolbar />
      <GalleryContent />
      <GalleryStatusBar />
      <InspectorModal />
    </div>
  );
}
