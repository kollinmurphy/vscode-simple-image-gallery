import type { GalleryFilter, GalleryImage } from '../../shared/types.js';

export interface ExtensionCount {
  ext: string;
  count: number;
}

export function filterImages(images: GalleryImage[], filter: GalleryFilter): GalleryImage[] {
  const query = filter.searchQuery.trim().toLowerCase();
  const selectedExtensions = filter.selectedExtensions;

  return images
    .filter((image) => {
      if (query && !image.name.toLowerCase().includes(query) && !image.path.toLowerCase().includes(query)) {
        return false;
      }
      return selectedExtensions.length === 0 || selectedExtensions.includes(image.extension.toLowerCase());
    })
    .sort((first, second) => {
      let comparison = 0;
      switch (filter.sortField) {
        case 'name':
          comparison = first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'size':
          comparison = first.sizeBytes - second.sizeBytes;
          break;
        case 'modified':
          comparison = first.modifiedTimestamp - second.modifiedTimestamp;
          break;
        case 'extension':
          comparison = first.extension.localeCompare(second.extension);
          break;
      }
      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });
}

export function countExtensions(images: GalleryImage[]): ExtensionCount[] {
  const counts = new Map<string, number>();
  for (const image of images) {
    const extension = image.extension.toLowerCase();
    counts.set(extension, (counts.get(extension) ?? 0) + 1);
  }
  return Array.from(counts, ([ext, count]) => ({ ext, count }))
    .sort((first, second) => second.count - first.count);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, unitIndex)).toFixed(1))} ${units[unitIndex]}`;
}

export function formatDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return 'Unknown';
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
