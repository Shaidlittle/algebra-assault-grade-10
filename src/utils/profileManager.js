/**
 * ProfileManager — manages multi-student profiles with isolated storage namespaces.
 *
 * Uses window.storage directly for shared profile keys (not namespaced),
 * and StorageAdapter for per-profile operations.
 */

// Constants
export const MAX_PROFILES = 10;
export const MIN_PROFILES = 5;
export const PROFILES_KEY = 'algebra-assault-profiles';
export const ACTIVE_PROFILE_KEY = 'algebra-assault-active-profile';

/**
 * Validates the raw input name before sanitization.
 * Rejects empty strings or strings exceeding 30 characters.
 *
 * @param {string} name - Raw input name
 * @returns {string|null} Trimmed name if valid, null if rejected
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 30) return null;
  return trimmed;
}

/**
 * Derives a namespace from a profile name.
 * Rules:
 * 1. Lowercase the input
 * 2. Replace all whitespace characters with hyphens
 * 3. Remove all characters that are not [a-z0-9-]
 * 4. Collapse consecutive hyphens into one
 * 5. Trim leading/trailing hyphens
 *
 * @param {string} name - The profile name (should be sanitized first)
 * @returns {string} The derived namespace
 */
export function deriveNamespace(name) {
  let result = name.toLowerCase();
  result = result.replace(/\s+/g, '-');
  result = result.replace(/[^a-z0-9-]/g, '');
  result = result.replace(/-{2,}/g, '-');
  result = result.replace(/^-+|-+$/g, '');
  return result;
}

/**
 * Returns the namespace prefix string for a profile (used by StorageAdapter).
 *
 * @param {object} profile - Profile object with id property
 * @returns {string} The namespace prefix
 */
export function getNamespacePrefix(profile) {
  return profile.id;
}

/**
 * Checks if a namespace collides with any existing profile.
 *
 * @param {string} namespace - The namespace to check
 * @param {Array} existingProfiles - Array of existing profile objects
 * @returns {boolean} True if collision exists
 */
export function hasNamespaceCollision(namespace, existingProfiles) {
  return existingProfiles.some((profile) => profile.id === namespace);
}

/**
 * Checks if the profile limit has been reached.
 *
 * @param {Array} profiles - Array of existing profiles
 * @returns {boolean} True if limit reached
 */
export function isProfileLimitReached(profiles) {
  return profiles.length >= MAX_PROFILES;
}

/**
 * Loads all profiles from storage.
 *
 * @returns {Promise<Array>} Array of profile objects
 */
export async function loadProfiles() {
  try {
    const result = await window.storage.get(PROFILES_KEY);
    if (result && result.value) {
      return JSON.parse(result.value);
    }
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Creates a new profile with the given name and curriculum.
 *
 * @param {string} name - Raw profile name
 * @param {string} curriculum - Curriculum choice ('caps' | 'ieb' | 'cambridge')
 * @returns {Promise<{success: boolean, profile?: object, error?: string}>}
 */
export async function createProfile(name, curriculum) {
  const sanitized = sanitizeName(name);
  if (sanitized === null) {
    if (typeof name === 'string' && name.trim().length > 30) {
      return { success: false, error: 'Name must be 30 characters or fewer' };
    }
    return { success: false, error: 'Please enter a name' };
  }

  const namespace = deriveNamespace(sanitized);
  if (namespace.length === 0) {
    return { success: false, error: 'Name must contain at least one letter or number' };
  }

  try {
    const profiles = await loadProfiles();

    if (isProfileLimitReached(profiles)) {
      return { success: false, error: 'Maximum of 10 profiles reached' };
    }

    if (hasNamespaceCollision(namespace, profiles)) {
      return { success: false, error: 'A profile with this name already exists' };
    }

    const profile = {
      id: namespace,
      name: sanitized,
      curriculum,
      createdAt: new Date().toISOString(),
    };

    const updatedProfiles = [...profiles, profile];
    const saveResult = await window.storage.set(
      PROFILES_KEY,
      JSON.stringify(updatedProfiles)
    );

    if (!saveResult) {
      return { success: false, error: 'Could not save profile. Please try again.' };
    }

    return { success: true, profile };
  } catch (e) {
    return { success: false, error: 'Could not save profile. Please try again.' };
  }
}

/**
 * Deletes a profile and all its associated namespaced storage keys.
 *
 * @param {string} id - The profile id (namespace) to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteProfile(id) {
  try {
    const profiles = await loadProfiles();
    const profileIndex = profiles.findIndex((p) => p.id === id);

    if (profileIndex === -1) {
      return { success: false, error: 'Profile not found' };
    }

    // Remove all namespaced keys for this profile
    const listResult = await window.storage.list(`${id}-`);
    if (listResult && listResult.keys) {
      for (const key of listResult.keys) {
        await window.storage.delete(key);
      }
    }

    // Remove profile from the list
    const updatedProfiles = profiles.filter((p) => p.id !== id);
    const saveResult = await window.storage.set(
      PROFILES_KEY,
      JSON.stringify(updatedProfiles)
    );

    if (!saveResult) {
      return { success: false, error: 'Could not delete profile. Please try again.' };
    }

    // If the deleted profile was the active one, clear the active profile
    const activeResult = await window.storage.get(ACTIVE_PROFILE_KEY);
    if (activeResult && activeResult.value === id) {
      await window.storage.delete(ACTIVE_PROFILE_KEY);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Could not delete profile. Please try again.' };
  }
}

/**
 * Switches to a different profile by setting it as the active profile.
 *
 * @param {string} id - The profile id to switch to
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function switchProfile(id) {
  try {
    const profiles = await loadProfiles();
    const profile = profiles.find((p) => p.id === id);

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    const result = await setActiveProfile(id);
    return result;
  } catch (e) {
    return { success: false, error: 'Could not switch profile. Please try again.' };
  }
}

/**
 * Gets the currently active profile.
 *
 * @returns {Promise<object|null>} The active profile object, or null if none set
 */
export async function getActiveProfile() {
  try {
    const activeResult = await window.storage.get(ACTIVE_PROFILE_KEY);
    if (!activeResult || !activeResult.value) {
      return null;
    }

    const profiles = await loadProfiles();
    const profile = profiles.find((p) => p.id === activeResult.value);
    return profile || null;
  } catch (e) {
    return null;
  }
}

/**
 * Sets the active profile by id.
 *
 * @param {string} id - The profile id to set as active
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setActiveProfile(id) {
  try {
    const result = await window.storage.set(ACTIVE_PROFILE_KEY, id);
    if (!result) {
      return { success: false, error: 'Could not set active profile. Please try again.' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Could not set active profile. Please try again.' };
  }
}
