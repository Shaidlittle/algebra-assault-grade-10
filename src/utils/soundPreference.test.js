import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSoundPreference, saveSoundPreference } from './soundPreference.js';

describe('soundPreference', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
    };
    window.storage = mockStorage;
  });

  describe('loadSoundPreference', () => {
    it('returns true when storage has value "true"', async () => {
      mockStorage.get.mockResolvedValue({ key: 'sound-preference', value: 'true' });

      const result = await loadSoundPreference();

      expect(mockStorage.get).toHaveBeenCalledWith('sound-preference');
      expect(result).toBe(true);
    });

    it('returns false when storage has value "false"', async () => {
      mockStorage.get.mockResolvedValue({ key: 'sound-preference', value: 'false' });

      const result = await loadSoundPreference();

      expect(result).toBe(false);
    });

    it('defaults to true when storage returns null', async () => {
      mockStorage.get.mockResolvedValue(null);

      const result = await loadSoundPreference();

      expect(result).toBe(true);
    });

    it('defaults to true when storage result has null value', async () => {
      mockStorage.get.mockResolvedValue({ key: 'sound-preference', value: null });

      const result = await loadSoundPreference();

      expect(result).toBe(true);
    });

    it('defaults to true when storage throws', async () => {
      mockStorage.get.mockRejectedValue(new Error('Storage error'));

      const result = await loadSoundPreference();

      expect(result).toBe(true);
    });

    it('defaults to true when value is not a valid boolean JSON', async () => {
      mockStorage.get.mockResolvedValue({ key: 'sound-preference', value: '"not-a-bool"' });

      const result = await loadSoundPreference();

      expect(result).toBe(false);
    });
  });

  describe('saveSoundPreference', () => {
    it('saves true as JSON string', async () => {
      mockStorage.set.mockResolvedValue({ key: 'sound-preference', value: 'true' });

      await saveSoundPreference(true);

      expect(mockStorage.set).toHaveBeenCalledWith('sound-preference', 'true');
    });

    it('saves false as JSON string', async () => {
      mockStorage.set.mockResolvedValue({ key: 'sound-preference', value: 'false' });

      await saveSoundPreference(false);

      expect(mockStorage.set).toHaveBeenCalledWith('sound-preference', 'false');
    });

    it('does not throw when storage throws', async () => {
      mockStorage.set.mockRejectedValue(new Error('Quota exceeded'));

      await expect(saveSoundPreference(true)).resolves.toBeUndefined();
    });
  });
});
