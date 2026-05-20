import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageAdapter } from './storageAdapter.js';

describe('StorageAdapter', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };
    window.storage = mockStorage;
  });

  describe('getFullKey', () => {
    it('prefixes key with namespace and hyphen', () => {
      const adapter = createStorageAdapter('sarah');
      expect(adapter.getFullKey('progress')).toBe('sarah-progress');
    });

    it('works with multi-word namespace', () => {
      const adapter = createStorageAdapter('james-jr');
      expect(adapter.getFullKey('xp')).toBe('james-jr-xp');
    });

    it('handles empty key', () => {
      const adapter = createStorageAdapter('test');
      expect(adapter.getFullKey('')).toBe('test-');
    });
  });

  describe('get', () => {
    it('calls window.storage.get with the full namespaced key', async () => {
      mockStorage.get.mockResolvedValue({ key: 'sarah-progress', value: '{}' });
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.get('progress');

      expect(mockStorage.get).toHaveBeenCalledWith('sarah-progress');
      expect(result).toEqual({ key: 'sarah-progress', value: '{}' });
    });

    it('returns null when key does not exist', async () => {
      mockStorage.get.mockResolvedValue(null);
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.get('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when storage throws', async () => {
      mockStorage.get.mockRejectedValue(new Error('Storage error'));
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.get('progress');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('calls window.storage.set with the full namespaced key and value', async () => {
      mockStorage.set.mockResolvedValue({ key: 'sarah-xp', value: '100' });
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.set('xp', '100');

      expect(mockStorage.set).toHaveBeenCalledWith('sarah-xp', '100');
      expect(result).toEqual({ key: 'sarah-xp', value: '100' });
    });

    it('returns null when storage throws', async () => {
      mockStorage.set.mockRejectedValue(new Error('Quota exceeded'));
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.set('xp', '100');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('calls window.storage.delete with the full namespaced key', async () => {
      mockStorage.delete.mockResolvedValue({ key: 'sarah-xp', deleted: true });
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.delete('xp');

      expect(mockStorage.delete).toHaveBeenCalledWith('sarah-xp');
      expect(result).toEqual({ key: 'sarah-xp', deleted: true });
    });

    it('returns null when storage throws', async () => {
      mockStorage.delete.mockRejectedValue(new Error('Storage error'));
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.delete('xp');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('calls window.storage.list with the full namespaced prefix', async () => {
      mockStorage.list.mockResolvedValue({ keys: ['sarah-progress', 'sarah-xp'] });
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.list('');

      expect(mockStorage.list).toHaveBeenCalledWith('sarah-');
      expect(result).toEqual({ keys: ['sarah-progress', 'sarah-xp'] });
    });

    it('appends sub-prefix to namespace prefix', async () => {
      mockStorage.list.mockResolvedValue({ keys: ['sarah-high-scores'] });
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.list('high');

      expect(mockStorage.list).toHaveBeenCalledWith('sarah-high');
      expect(result).toEqual({ keys: ['sarah-high-scores'] });
    });

    it('returns null when storage throws', async () => {
      mockStorage.list.mockRejectedValue(new Error('Storage error'));
      const adapter = createStorageAdapter('sarah');

      const result = await adapter.list('');

      expect(result).toBeNull();
    });
  });
});
