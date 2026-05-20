import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeName,
  deriveNamespace,
  getNamespacePrefix,
  hasNamespaceCollision,
  isProfileLimitReached,
  loadProfiles,
  createProfile,
  deleteProfile,
  switchProfile,
  getActiveProfile,
  setActiveProfile,
  MAX_PROFILES,
  MIN_PROFILES,
  PROFILES_KEY,
  ACTIVE_PROFILE_KEY,
} from './profileManager.js';

// Mock window.storage
function createMockStorage() {
  const store = new Map();
  return {
    get: vi.fn(async (key) => {
      const value = store.get(key);
      return value !== undefined ? { key, value } : null;
    }),
    set: vi.fn(async (key, value) => {
      store.set(key, value);
      return { key, value };
    }),
    delete: vi.fn(async (key) => {
      store.delete(key);
      return { key, deleted: true };
    }),
    list: vi.fn(async (prefix = '') => {
      const keys = [];
      for (const k of store.keys()) {
        if (k.startsWith(prefix)) keys.push(k);
      }
      return { keys };
    }),
    _store: store,
  };
}

describe('ProfileManager', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    global.window = { storage: mockStorage };
  });

  describe('Constants', () => {
    it('exports MAX_PROFILES as 10', () => {
      expect(MAX_PROFILES).toBe(10);
    });

    it('exports MIN_PROFILES as 5', () => {
      expect(MIN_PROFILES).toBe(5);
    });

    it('exports PROFILES_KEY', () => {
      expect(PROFILES_KEY).toBe('algebra-assault-profiles');
    });

    it('exports ACTIVE_PROFILE_KEY', () => {
      expect(ACTIVE_PROFILE_KEY).toBe('algebra-assault-active-profile');
    });
  });

  describe('sanitizeName', () => {
    it('returns trimmed name for valid input', () => {
      expect(sanitizeName('Sarah')).toBe('Sarah');
    });

    it('trims whitespace', () => {
      expect(sanitizeName('  Anna  ')).toBe('Anna');
    });

    it('rejects empty string', () => {
      expect(sanitizeName('')).toBeNull();
    });

    it('rejects whitespace-only string', () => {
      expect(sanitizeName('   ')).toBeNull();
    });

    it('rejects strings longer than 30 characters', () => {
      expect(sanitizeName('a'.repeat(31))).toBeNull();
    });

    it('accepts exactly 30 characters', () => {
      const name = 'a'.repeat(30);
      expect(sanitizeName(name)).toBe(name);
    });

    it('rejects non-string input', () => {
      expect(sanitizeName(null)).toBeNull();
      expect(sanitizeName(undefined)).toBeNull();
      expect(sanitizeName(123)).toBeNull();
    });
  });

  describe('deriveNamespace', () => {
    it('lowercases the input', () => {
      expect(deriveNamespace('Sarah')).toBe('sarah');
    });

    it('replaces whitespace with hyphens', () => {
      expect(deriveNamespace('James Jr')).toBe('james-jr');
    });

    it('removes non-alphanumeric non-hyphen characters', () => {
      expect(deriveNamespace("O'Brien")).toBe('obrien');
    });

    it('preserves existing hyphens', () => {
      expect(deriveNamespace('Mary-Jane')).toBe('mary-jane');
    });

    it('collapses consecutive hyphens', () => {
      expect(deriveNamespace('a--b')).toBe('a-b');
    });

    it('trims leading and trailing hyphens', () => {
      expect(deriveNamespace('-hello-')).toBe('hello');
    });

    it('handles multiple whitespace characters', () => {
      expect(deriveNamespace('  Hi There  ')).toBe('hi-there');
    });

    it('handles tabs and newlines as whitespace', () => {
      expect(deriveNamespace("hello\tworld\n")).toBe('hello-world');
    });

    it('returns empty string for all-special-character input', () => {
      expect(deriveNamespace("!@#$%^&*()")).toBe('');
    });

    it('handles numeric input', () => {
      expect(deriveNamespace('123')).toBe('123');
    });
  });

  describe('getNamespacePrefix', () => {
    it('returns the profile id', () => {
      expect(getNamespacePrefix({ id: 'sarah', name: 'Sarah' })).toBe('sarah');
    });
  });

  describe('hasNamespaceCollision', () => {
    it('returns true when namespace matches an existing profile id', () => {
      const profiles = [{ id: 'sarah', name: 'Sarah' }];
      expect(hasNamespaceCollision('sarah', profiles)).toBe(true);
    });

    it('returns false when no collision', () => {
      const profiles = [{ id: 'sarah', name: 'Sarah' }];
      expect(hasNamespaceCollision('james', profiles)).toBe(false);
    });

    it('returns false for empty profiles array', () => {
      expect(hasNamespaceCollision('sarah', [])).toBe(false);
    });
  });

  describe('isProfileLimitReached', () => {
    it('returns false when under limit', () => {
      const profiles = Array(9).fill({ id: 'test' });
      expect(isProfileLimitReached(profiles)).toBe(false);
    });

    it('returns true when at limit', () => {
      const profiles = Array(10).fill({ id: 'test' });
      expect(isProfileLimitReached(profiles)).toBe(true);
    });

    it('returns true when over limit', () => {
      const profiles = Array(11).fill({ id: 'test' });
      expect(isProfileLimitReached(profiles)).toBe(true);
    });

    it('returns false for empty array', () => {
      expect(isProfileLimitReached([])).toBe(false);
    });
  });

  describe('loadProfiles', () => {
    it('returns empty array when no profiles stored', async () => {
      const profiles = await loadProfiles();
      expect(profiles).toEqual([]);
    });

    it('returns parsed profiles from storage', async () => {
      const stored = [{ id: 'sarah', name: 'Sarah', curriculum: 'caps' }];
      mockStorage._store.set(PROFILES_KEY, JSON.stringify(stored));
      const profiles = await loadProfiles();
      expect(profiles).toEqual(stored);
    });

    it('returns empty array on storage failure', async () => {
      mockStorage.get.mockRejectedValueOnce(new Error('Storage error'));
      const profiles = await loadProfiles();
      expect(profiles).toEqual([]);
    });
  });

  describe('createProfile', () => {
    it('creates a profile successfully', async () => {
      const result = await createProfile('Sarah', 'caps');
      expect(result.success).toBe(true);
      expect(result.profile).toMatchObject({
        id: 'sarah',
        name: 'Sarah',
        curriculum: 'caps',
      });
      expect(result.profile.createdAt).toBeDefined();
    });

    it('rejects empty name', async () => {
      const result = await createProfile('', 'caps');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a name');
    });

    it('rejects name over 30 chars', async () => {
      const result = await createProfile('a'.repeat(31), 'caps');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name must be 30 characters or fewer');
    });

    it('rejects name that produces empty namespace', async () => {
      const result = await createProfile("!@#$%", 'caps');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name must contain at least one letter or number');
    });

    it('rejects namespace collision', async () => {
      mockStorage._store.set(
        PROFILES_KEY,
        JSON.stringify([{ id: 'sarah', name: 'Sarah', curriculum: 'caps' }])
      );
      const result = await createProfile('Sarah', 'ieb');
      expect(result.success).toBe(false);
      expect(result.error).toBe('A profile with this name already exists');
    });

    it('rejects when profile limit reached', async () => {
      const profiles = Array.from({ length: 10 }, (_, i) => ({
        id: `profile-${i}`,
        name: `Profile ${i}`,
        curriculum: 'caps',
      }));
      mockStorage._store.set(PROFILES_KEY, JSON.stringify(profiles));
      const result = await createProfile('NewProfile', 'caps');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum of 10 profiles reached');
    });

    it('handles storage write failure gracefully', async () => {
      mockStorage.set.mockResolvedValueOnce(null);
      const result = await createProfile('Sarah', 'caps');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not save profile');
    });
  });

  describe('deleteProfile', () => {
    beforeEach(() => {
      const profiles = [
        { id: 'sarah', name: 'Sarah', curriculum: 'caps' },
        { id: 'james-jr', name: 'James Jr', curriculum: 'ieb' },
      ];
      mockStorage._store.set(PROFILES_KEY, JSON.stringify(profiles));
      mockStorage._store.set('sarah-progress', 'some-data');
      mockStorage._store.set('sarah-xp', '100');
    });

    it('deletes a profile and its namespaced keys', async () => {
      const result = await deleteProfile('sarah');
      expect(result.success).toBe(true);

      const profiles = JSON.parse(mockStorage._store.get(PROFILES_KEY));
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe('james-jr');
    });

    it('clears active profile if deleted profile was active', async () => {
      mockStorage._store.set(ACTIVE_PROFILE_KEY, 'sarah');
      await deleteProfile('sarah');
      expect(mockStorage._store.has(ACTIVE_PROFILE_KEY)).toBe(false);
    });

    it('returns error for non-existent profile', async () => {
      const result = await deleteProfile('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile not found');
    });

    it('handles storage failure gracefully', async () => {
      mockStorage.set.mockResolvedValueOnce(null);
      const result = await deleteProfile('sarah');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not delete profile');
    });
  });

  describe('switchProfile', () => {
    beforeEach(() => {
      const profiles = [
        { id: 'sarah', name: 'Sarah', curriculum: 'caps' },
        { id: 'james-jr', name: 'James Jr', curriculum: 'ieb' },
      ];
      mockStorage._store.set(PROFILES_KEY, JSON.stringify(profiles));
    });

    it('switches to an existing profile', async () => {
      const result = await switchProfile('james-jr');
      expect(result.success).toBe(true);
      expect(mockStorage._store.get(ACTIVE_PROFILE_KEY)).toBe('james-jr');
    });

    it('returns error for non-existent profile', async () => {
      const result = await switchProfile('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile not found');
    });
  });

  describe('getActiveProfile', () => {
    it('returns null when no active profile set', async () => {
      const profile = await getActiveProfile();
      expect(profile).toBeNull();
    });

    it('returns the active profile', async () => {
      const profiles = [{ id: 'sarah', name: 'Sarah', curriculum: 'caps' }];
      mockStorage._store.set(PROFILES_KEY, JSON.stringify(profiles));
      mockStorage._store.set(ACTIVE_PROFILE_KEY, 'sarah');

      const profile = await getActiveProfile();
      expect(profile).toEqual(profiles[0]);
    });

    it('returns null if active profile id does not match any profile', async () => {
      mockStorage._store.set(PROFILES_KEY, JSON.stringify([]));
      mockStorage._store.set(ACTIVE_PROFILE_KEY, 'nonexistent');

      const profile = await getActiveProfile();
      expect(profile).toBeNull();
    });

    it('returns null on storage failure', async () => {
      mockStorage.get.mockRejectedValueOnce(new Error('fail'));
      const profile = await getActiveProfile();
      expect(profile).toBeNull();
    });
  });

  describe('setActiveProfile', () => {
    it('sets the active profile id in storage', async () => {
      const result = await setActiveProfile('sarah');
      expect(result.success).toBe(true);
      expect(mockStorage._store.get(ACTIVE_PROFILE_KEY)).toBe('sarah');
    });

    it('handles storage failure gracefully', async () => {
      mockStorage.set.mockResolvedValueOnce(null);
      const result = await setActiveProfile('sarah');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not set active profile');
    });
  });
});
