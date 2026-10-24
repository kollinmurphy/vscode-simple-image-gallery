import * as assert from 'assert';
import { GalleryFilter, GalleryImage } from '../shared/types.js';
import {
  countExtensions,
  filterImages,
  formatBytes,
  formatDate,
  getFileDirectory,
  getTotalSizeBytes,
} from '../webview/utils/gallery.js';

function image(overrides: Partial<GalleryImage>): GalleryImage {
  return {
    id: 'file:///image.png',
    name: 'image.png',
    path: 'assets/image.png',
    fullPath: '/workspace/assets/image.png',
    uri: 'file:///image.png',
    sizeBytes: 1024,
    extension: 'png',
    modifiedTimestamp: 1_700_000_000_000,
    createdTimestamp: 1_600_000_000_000,
    ...overrides,
  };
}

const baseFilter: GalleryFilter = {
  searchQuery: '',
  selectedExtensions: [],
  sortField: 'name',
  sortOrder: 'asc',
  zoomLevel: 2,
};

suite('Gallery utility tests', () => {
  test('filters by filename or relative path case-insensitively', () => {
    const images = [
      image({ name: 'Banner.PNG', path: 'Marketing/Banner.PNG', extension: 'png' }),
      image({ id: 'logo', name: 'logo.svg', path: 'icons/logo.svg', extension: 'svg' }),
    ];

    assert.deepStrictEqual(
      filterImages(images, { ...baseFilter, searchQuery: 'MARKETING' }),
      [images[0]]
    );
    assert.deepStrictEqual(
      filterImages(images, { ...baseFilter, searchQuery: ' LOGO.SVG ' }),
      [images[1]]
    );
  });

  test('combines search and extension filters case-insensitively', () => {
    const images = [
      image({ name: 'Photo.png', extension: 'PNG' }),
      image({ id: 'photo-jpg', name: 'photo.jpg', path: 'photos/photo.jpg', extension: 'jpg' }),
      image({ id: 'other', name: 'diagram.svg', path: 'icons/diagram.svg', extension: 'svg' }),
    ];

    const result = filterImages(images, {
      ...baseFilter,
      searchQuery: 'photo',
      selectedExtensions: ['jpg'],
    });

    assert.deepStrictEqual(result, [images[1]]);
  });

  test('sorts every supported field in ascending and descending order', () => {
    const images = [
      image({ name: 'alpha.png', extension: 'png', sizeBytes: 20, modifiedTimestamp: 30 }),
      image({ id: 'beta', name: 'Beta.png', extension: 'jpg', sizeBytes: 10, modifiedTimestamp: 20 }),
      image({ id: 'gamma', name: 'gamma.png', extension: 'svg', sizeBytes: 30, modifiedTimestamp: 10 }),
    ];

    assert.deepStrictEqual(
      filterImages(images, { ...baseFilter, sortField: 'size' }).map((item) => item.name),
      ['Beta.png', 'alpha.png', 'gamma.png']
    );
    assert.deepStrictEqual(
      filterImages(images, { ...baseFilter, sortField: 'modified', sortOrder: 'desc' }).map((item) => item.name),
      ['alpha.png', 'Beta.png', 'gamma.png']
    );
    assert.deepStrictEqual(
      filterImages(images, { ...baseFilter, sortField: 'extension' }).map((item) => item.extension),
      ['jpg', 'png', 'svg']
    );
  });

  test('does not mutate the source array when filtering', () => {
    const images = [
      image({ name: 'z.png' }),
      image({ id: 'a', name: 'a.png' }),
    ];
    const original = images.map((item) => item.name);

    filterImages(images, baseFilter);

    assert.deepStrictEqual(images.map((item) => item.name), original);
  });

  test('counts and normalizes extensions', () => {
    const counts = countExtensions([
      image({ extension: 'PNG' }),
      image({ id: 'png-2', extension: 'png' }),
      image({ id: 'jpg', extension: 'JPG' }),
    ]);

    assert.deepStrictEqual(counts, [
      { ext: 'png', count: 2 },
      { ext: 'jpg', count: 1 },
    ]);
  });

  test('formats byte sizes across supported units', () => {
    assert.strictEqual(formatBytes(0), '0 B');
    assert.strictEqual(formatBytes(1024), '1 KB');
    assert.strictEqual(formatBytes(1536), '1.5 KB');
    assert.strictEqual(formatBytes(1024 ** 2), '1 MB');
    assert.strictEqual(formatBytes(1024 ** 4), '1 TB');
  });

  test('returns Unknown for invalid modification dates', () => {
    assert.strictEqual(formatDate(0), 'Unknown');
    assert.strictEqual(formatDate(-1), 'Unknown');
    assert.strictEqual(formatDate(Number.NaN), 'Unknown');
    assert.notStrictEqual(formatDate(1_700_000_000_000), 'Unknown');
  });

  test('sums gallery sizes defensively', () => {
    assert.strictEqual(getTotalSizeBytes([
      image({ sizeBytes: 12 }),
      image({ sizeBytes: 30 }),
    ]), 42);
  });

  test('gets directories for POSIX and Windows paths', () => {
    assert.strictEqual(getFileDirectory('/workspace/assets/image.png'), '/workspace/assets');
    assert.strictEqual(getFileDirectory('C:\\workspace\\assets\\image.png'), 'C:\\workspace\\assets');
    assert.strictEqual(getFileDirectory('image.png'), './');
  });
});
