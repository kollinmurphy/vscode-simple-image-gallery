import './styles.css';
import {
  ExtensionToWebviewMessage,
  GalleryFilter,
  GalleryImage,
  ViewMode,
  WebviewState,
  WebviewToExtensionMessage,
} from '../shared/types';

declare function acquireVsCodeApi<T = unknown>(): {
  postMessage(message: unknown): void;
  getState(): T | undefined;
  setState(state: T): T;
};

const vscode = acquireVsCodeApi<WebviewState>();

const DEFAULT_FILTER: GalleryFilter = {
  searchQuery: '',
  selectedExtensions: [],
  sortField: 'name',
  sortOrder: 'asc',
  zoomLevel: 180,
};

let state: WebviewState = vscode.getState() || {
  images: [],
  filter: DEFAULT_FILTER,
  viewMode: 'grid',
  isLoading: true,
  workspaceName: 'Workspace',
};

function setState(updater: Partial<WebviewState> | ((prev: WebviewState) => Partial<WebviewState>)) {
  const partial = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...partial };
  vscode.setState(state);
  render();
}

function postMessage(message: WebviewToExtensionMessage) {
  vscode.postMessage(message);
}

// Format utilities
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
  if (!timestamp) {
    return 'Unknown';
  }
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Icons
const ICONS = {
  gallery: `<svg viewBox="0 0 16 16"><path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-1 10H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1z"/><circle cx="5" cy="6" r="1.5"/><path d="m3.5 11 3-3.5 2 2.5 3-4 2.5 5z"/></svg>`,
  search: `<svg viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>`,
  clear: `<svg viewBox="0 0 16 16" width="12" height="12"><path fill="currentColor" d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708z"/></svg>`,
  refresh: `<svg viewBox="0 0 16 16"><path d="M13.65 2.35A7.958 7.958 0 0 0 8 0a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.76-4.24l-2.24 2.24H16V0l-2.35 2.35z"/></svg>`,
  grid: `<svg viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/></svg>`,
  compact: `<svg viewBox="0 0 16 16"><path d="M1 1h3v3H1zm5 0h3v3H6zm5 0h3v3h-3zM1 6h3v3H1zm5 0h3v3H6zm5 0h3v3h-3zM1 11h3v3H1zm5 0h3v3H6zm5 0h3v3h-3z"/></svg>`,
  list: `<svg viewBox="0 0 16 16"><path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>`,
  close: `<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M13.854 2.146a.5.5 0 0 1 0 .708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708 0z"/></svg>`,
  folder: `<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10l-.5-.5zm-.5 10H2V3h4.29l.86.85.35.15H14v9z"/></svg>`,
  external: `<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M1.5 1H6v1H2v12h12v-4h1v4.5l-.5.5h-13l-.5-.5v-13l.5-.5zM10 1v1h3.3L7.1 8.1l.8.8L14 2.7V6h1V1h-5z"/></svg>`,
  copy: `<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M4 4h7v1H4V4zm0 3h7v1H4V7zm0 3h4v1H4v-1zm9-8H3L2 3v10l1 1h10l1-1V3l-1-1zm0 11H3V3h10v10z"/></svg>`,
};

// Filter & Sort logic
function getFilteredImages(): GalleryImage[] {
  const query = state.filter.searchQuery.trim().toLowerCase();
  const selectedExts = state.filter.selectedExtensions;

  return state.images.filter((img) => {
    if (query && !img.name.toLowerCase().includes(query) && !img.path.toLowerCase().includes(query)) {
      return false;
    }
    if (selectedExts.length > 0 && !selectedExts.includes(img.extension.toLowerCase())) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    let cmp = 0;
    switch (state.filter.sortField) {
      case 'name':
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        break;
      case 'size':
        cmp = a.sizeBytes - b.sizeBytes;
        break;
      case 'modified':
        cmp = a.modifiedTimestamp - b.modifiedTimestamp;
        break;
      case 'extension':
        cmp = a.extension.localeCompare(b.extension);
        break;
    }
    return state.filter.sortOrder === 'asc' ? cmp : -cmp;
  });
}

function getAllExtensions(): { ext: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const img of state.images) {
    const ext = img.extension.toLowerCase();
    counts.set(ext, (counts.get(ext) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([ext, count]) => ({ ext, count }))
    .sort((a, b) => b.count - a.count);
}

// Render the application
function render() {
  const app = document.getElementById('app');
  if (!app) {
    return;
  }

  const filteredImages = getFilteredImages();
  const allExts = getAllExtensions();
  const inspectingImage = state.inspectingImageId
    ? state.images.find((img) => img.id === state.inspectingImageId)
    : undefined;

  app.innerHTML = `
    <div class="app-container" style="--card-width: ${state.filter.zoomLevel}px;">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <div class="header-title">
            ${ICONS.gallery}
            <span>Image Gallery</span>
          </div>
          <span class="workspace-badge">${escapeHtml(state.workspaceName || 'Workspace')}</span>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-refresh" title="Rescan Workspace Images">
            ${ICONS.refresh}
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <!-- Toolbar & Controls -->
      <section class="toolbar">
        <div class="toolbar-section">
          <!-- Search box -->
          <div class="search-wrapper">
            <span class="search-icon">${ICONS.search}</span>
            <input 
              type="text" 
              class="search-input" 
              id="search-input" 
              placeholder="Search images..." 
              value="${escapeHtml(state.filter.searchQuery)}"
            />
            ${
              state.filter.searchQuery
                ? `<button class="search-clear" id="btn-clear-search">${ICONS.clear}</button>`
                : ''
            }
          </div>

          <!-- Format chips -->
          <div class="filter-chips">
            <button 
              class="chip ${state.filter.selectedExtensions.length === 0 ? 'active' : ''}" 
              data-ext="all"
            >
              All <span class="chip-count">${state.images.length}</span>
            </button>
            ${allExts
              .slice(0, 5)
              .map(
                (item) => `
                <button 
                  class="chip ${state.filter.selectedExtensions.includes(item.ext) ? 'active' : ''}" 
                  data-ext="${item.ext}"
                >
                  ${item.ext.toUpperCase()} <span class="chip-count">${item.count}</span>
                </button>
              `
              )
              .join('')}
          </div>
        </div>

        <div class="toolbar-section">
          <!-- Sort Field -->
          <select class="select-input" id="sort-field">
            <option value="name" ${state.filter.sortField === 'name' ? 'selected' : ''}>Sort by Name</option>
            <option value="size" ${state.filter.sortField === 'size' ? 'selected' : ''}>Sort by Size</option>
            <option value="modified" ${state.filter.sortField === 'modified' ? 'selected' : ''}>Sort by Date</option>
            <option value="extension" ${state.filter.sortField === 'extension' ? 'selected' : ''}>Sort by Type</option>
          </select>

          <!-- Sort Order -->
          <button class="btn-icon" id="btn-sort-order" title="Toggle Sort Direction (${state.filter.sortOrder.toUpperCase()})">
            <span>${state.filter.sortOrder === 'asc' ? '▲' : '▼'}</span>
          </button>

          <!-- Zoom Slider (only in grid view) -->
          ${
            state.viewMode === 'grid'
              ? `
            <div class="zoom-control" title="Adjust thumbnail size">
              <span>Zoom</span>
              <input 
                type="range" 
                class="zoom-slider" 
                id="zoom-slider" 
                min="120" 
                max="320" 
                value="${state.filter.zoomLevel}"
              />
            </div>
          `
              : ''
          }

          <!-- View Mode Switcher -->
          <div class="view-mode-group">
            <button 
              class="btn-icon ${state.viewMode === 'grid' ? 'active' : ''}" 
              data-view="grid" 
              title="Grid View"
            >${ICONS.grid}</button>
            <button 
              class="btn-icon ${state.viewMode === 'compact' ? 'active' : ''}" 
              data-view="compact" 
              title="Compact View"
            >${ICONS.compact}</button>
            <button 
              class="btn-icon ${state.viewMode === 'list' ? 'active' : ''}" 
              data-view="list" 
              title="List View"
            >${ICONS.list}</button>
          </div>
        </div>
      </section>

      <!-- Content Area -->
      <main class="content-area" id="content-area">
        ${renderContent(filteredImages)}
      </main>

      <!-- Status Bar -->
      <footer class="status-bar">
        <div class="status-left">
          <span>Showing ${filteredImages.length} of ${state.images.length} images</span>
          ${
            state.selectedImageId
              ? `<span>Selected: <strong>${escapeHtml(
                  state.images.find((i) => i.id === state.selectedImageId)?.name || ''
                )}</strong></span>`
              : ''
          }
        </div>
        <div class="status-right">
          <span>Double-click to inspect • Press Esc to close</span>
        </div>
      </footer>

      <!-- Inspector Modal -->
      ${inspectingImage ? renderInspector(inspectingImage) : ''}
    </div>
  `;

  attachEventListeners();
}

function renderContent(images: GalleryImage[]): string {
  if (state.isLoading) {
    return `
      <div class="state-container">
        <div class="spinner"></div>
        <div class="state-title">Scanning Workspace for Images...</div>
        <div class="state-desc">Searching for PNG, JPG, WebP, SVG, GIF, and other graphics.</div>
      </div>
    `;
  }

  if (images.length === 0) {
    return `
      <div class="state-container">
        <div class="state-icon">${ICONS.gallery}</div>
        <div class="state-title">${state.images.length === 0 ? 'No Images Found' : 'No Matching Images'}</div>
        <div class="state-desc">
          ${
            state.images.length === 0
              ? 'Add images to your workspace or click Refresh to rescan.'
              : 'Try clearing your search query or selecting a different filter.'
          }
        </div>
        ${
          state.filter.searchQuery || state.filter.selectedExtensions.length > 0
            ? `<button class="btn btn-secondary" id="btn-reset-filters">Reset Filters</button>`
            : `<button class="btn btn-primary" id="btn-empty-refresh">${ICONS.refresh} Scan Again</button>`
        }
      </div>
    `;
  }

  if (state.viewMode === 'list') {
    return `
      <div class="image-list">
        ${images
          .map(
            (img) => `
            <div 
              class="list-row ${img.id === state.selectedImageId ? 'selected' : ''}" 
              data-id="${img.id}"
            >
              <div class="list-thumb checkerboard">
                <img src="${img.uri}" alt="${escapeHtml(img.name)}" loading="lazy" />
              </div>
              <div class="list-name" title="${escapeHtml(img.name)}">${escapeHtml(img.name)}</div>
              <div class="list-path" title="${escapeHtml(img.path)}">${escapeHtml(img.path)}</div>
              <div class="list-size">${formatBytes(img.sizeBytes)}</div>
              <div class="list-date">${formatDate(img.modifiedTimestamp)}</div>
              <div class="list-actions">
                <button class="btn-icon btn-action-open" data-path="${escapeHtml(img.fullPath)}" title="Open in VS Code Editor">${ICONS.external}</button>
                <button class="btn-icon btn-action-copy" data-text="${escapeHtml(img.path)}" title="Copy Relative Path">${ICONS.copy}</button>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
    `;
  }

  // Grid & Compact views
  return `
    <div class="image-grid ${state.viewMode === 'compact' ? 'compact' : ''}">
      ${images
        .map(
          (img) => `
          <div 
            class="gallery-card ${img.id === state.selectedImageId ? 'selected' : ''}" 
            data-id="${img.id}"
            title="${escapeHtml(img.path)} (${formatBytes(img.sizeBytes)})"
          >
            <div class="card-preview checkerboard">
              <img src="${img.uri}" alt="${escapeHtml(img.name)}" loading="lazy" />
            </div>
            <div class="card-info">
              <div class="card-name">${escapeHtml(img.name)}</div>
              <div class="card-meta">
                <span>${formatBytes(img.sizeBytes)}</span>
                <span class="card-badge">${img.extension}</span>
              </div>
            </div>
          </div>
        `
        )
        .join('')}
    </div>
  `;
}

function renderInspector(img: GalleryImage): string {
  return `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-content" id="modal-content">
        <header class="modal-header">
          <div class="modal-title" title="${escapeHtml(img.name)}">${escapeHtml(img.name)}</div>
          <button class="btn-icon" id="btn-modal-close" title="Close (Esc)">${ICONS.close}</button>
        </header>
        <div class="modal-body">
          <div class="modal-preview checkerboard">
            <img src="${img.uri}" alt="${escapeHtml(img.name)}" />
          </div>
          <div class="modal-sidebar">
            <div class="meta-group">
              <div class="meta-item">
                <span class="meta-label">File Name</span>
                <span class="meta-value">${escapeHtml(img.name)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Relative Path</span>
                <span class="meta-value">${escapeHtml(img.path)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">File Size</span>
                <span class="meta-value">${formatBytes(img.sizeBytes)} (${img.sizeBytes.toLocaleString()} bytes)</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Format</span>
                <span class="meta-value">${img.extension.toUpperCase()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Last Modified</span>
                <span class="meta-value">${formatDate(img.modifiedTimestamp)}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn-primary" id="btn-modal-open-editor">
                ${ICONS.external}
                <span>Open in VS Code</span>
              </button>
              <button class="btn btn-secondary" id="btn-modal-reveal">
                ${ICONS.folder}
                <span>Reveal in System Explorer</span>
              </button>
              <button class="btn btn-secondary" id="btn-modal-copy-path">
                ${ICONS.copy}
                <span>Copy Relative Path</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      setState({ isLoading: true });
      postMessage({ type: 'refresh' });
    };
  }

  const emptyRefreshBtn = document.getElementById('btn-empty-refresh');
  if (emptyRefreshBtn) {
    emptyRefreshBtn.onclick = () => {
      setState({ isLoading: true });
      postMessage({ type: 'refresh' });
    };
  }

  // Reset filters
  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.onclick = () => {
      setState({
        filter: {
          ...state.filter,
          searchQuery: '',
          selectedExtensions: [],
        },
      });
    };
  }

  // Search input
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.oninput = (e) => {
      const val = (e.target as HTMLInputElement).value;
      setState((prev) => ({
        filter: { ...prev.filter, searchQuery: val },
      }));
      // Keep input focused after state re-render
      setTimeout(() => {
        const input = document.getElementById('search-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.selectionStart = input.selectionEnd = input.value.length;
        }
      }, 0);
    };
  }

  const clearSearchBtn = document.getElementById('btn-clear-search');
  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      setState((prev) => ({
        filter: { ...prev.filter, searchQuery: '' },
      }));
    };
  }

  // Extension filter chips
  document.querySelectorAll<HTMLButtonElement>('.chip').forEach((chip) => {
    chip.onclick = () => {
      const ext = chip.getAttribute('data-ext');
      if (!ext || ext === 'all') {
        setState((prev) => ({
          filter: { ...prev.filter, selectedExtensions: [] },
        }));
      } else {
        setState((prev) => {
          const current = prev.filter.selectedExtensions;
          const next = current.includes(ext)
            ? current.filter((e) => e !== ext)
            : [...current, ext];
          return {
            filter: { ...prev.filter, selectedExtensions: next },
          };
        });
      }
    };
  });

  // Sort dropdown
  const sortField = document.getElementById('sort-field') as HTMLSelectElement | null;
  if (sortField) {
    sortField.onchange = (e) => {
      const val = (e.target as HTMLSelectElement).value as GalleryFilter['sortField'];
      setState((prev) => ({
        filter: { ...prev.filter, sortField: val },
      }));
    };
  }

  // Sort order button
  const sortOrderBtn = document.getElementById('btn-sort-order');
  if (sortOrderBtn) {
    sortOrderBtn.onclick = () => {
      setState((prev) => ({
        filter: {
          ...prev.filter,
          sortOrder: prev.filter.sortOrder === 'asc' ? 'desc' : 'asc',
        },
      }));
    };
  }

  // Zoom slider
  const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement | null;
  if (zoomSlider) {
    zoomSlider.oninput = (e) => {
      const val = Number((e.target as HTMLInputElement).value);
      setState((prev) => ({
        filter: { ...prev.filter, zoomLevel: val },
      }));
    };
  }

  // View mode switcher
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
    btn.onclick = () => {
      const mode = btn.getAttribute('data-view') as ViewMode;
      if (mode) {
        setState({ viewMode: mode });
      }
    };
  });

  // Card / row interactions
  document.querySelectorAll<HTMLElement>('.gallery-card, .list-row').forEach((item) => {
    item.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.list-actions')) {
        return;
      }
      const id = item.getAttribute('data-id');
      if (id) {
        setState({ selectedImageId: id });
      }
    };

    item.ondblclick = () => {
      const id = item.getAttribute('data-id');
      if (id) {
        setState({ selectedImageId: id, inspectingImageId: id });
      }
    };
  });

  // Quick action buttons in list view
  document.querySelectorAll<HTMLButtonElement>('.btn-action-open').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const p = btn.getAttribute('data-path');
      if (p) {
        postMessage({ type: 'openFile', filePath: p });
      }
    };
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-action-copy').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-text');
      if (text) {
        postMessage({ type: 'copyToClipboard', text, label: 'relative path' });
      }
    };
  });

  // Modal actions
  const closeModal = () => {
    setState({ inspectingImageId: undefined });
  };

  const closeBtn = document.getElementById('btn-modal-close');
  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }

  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    };
  }

  const activeImg = state.inspectingImageId
    ? state.images.find((i) => i.id === state.inspectingImageId)
    : undefined;

  if (activeImg) {
    const modalOpenBtn = document.getElementById('btn-modal-open-editor');
    if (modalOpenBtn) {
      modalOpenBtn.onclick = () => {
        postMessage({ type: 'openFile', filePath: activeImg.fullPath });
      };
    }

    const modalRevealBtn = document.getElementById('btn-modal-reveal');
    if (modalRevealBtn) {
      modalRevealBtn.onclick = () => {
        postMessage({ type: 'revealInExplorer', filePath: activeImg.fullPath });
      };
    }

    const modalCopyBtn = document.getElementById('btn-modal-copy-path');
    if (modalCopyBtn) {
      modalCopyBtn.onclick = () => {
        postMessage({ type: 'copyToClipboard', text: activeImg.path, label: 'relative path' });
      };
    }
  }
}

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state.inspectingImageId) {
      setState({ inspectingImageId: undefined });
    }
  } else if (e.key === 'Enter') {
    if (state.selectedImageId && !state.inspectingImageId) {
      setState({ inspectingImageId: state.selectedImageId });
    }
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    // Navigate images with arrow keys
    const filtered = getFilteredImages();
    if (filtered.length === 0) {
      return;
    }

    const currentId = state.inspectingImageId || state.selectedImageId;
    const currentIndex = filtered.findIndex((i) => i.id === currentId);
    let nextIndex = 0;

    if (e.key === 'ArrowRight') {
      nextIndex = currentIndex >= 0 ? (currentIndex + 1) % filtered.length : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
    }

    const nextImage = filtered[nextIndex];
    if (nextImage) {
      setState({
        selectedImageId: nextImage.id,
        ...(state.inspectingImageId ? { inspectingImageId: nextImage.id } : {}),
      });
    }
  }
});

// Listen for messages from the Extension Host
window.addEventListener('message', (event) => {
  const message = event.data as ExtensionToWebviewMessage;
  switch (message.type) {
    case 'init': {
      setState({
        workspaceName: message.payload.workspaceName,
        images: message.payload.images,
        isLoading: false,
      });
      break;
    }
    case 'setLoading': {
      setState({ isLoading: message.payload.isLoading });
      break;
    }
    case 'setImages': {
      setState({ images: message.payload.images, isLoading: false });
      break;
    }
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial render & notify extension host
render();
postMessage({ type: 'ready' });

