import { render } from 'solid-js/web';
import { App } from './components/App.js';
import { GalleryProvider } from './state/GalleryContext.js';
import './gallery.css';

const app = document.getElementById('app');

if (app) {
  render(
    () => (
      <GalleryProvider>
        <App />
      </GalleryProvider>
    ),
    app
  );
}
