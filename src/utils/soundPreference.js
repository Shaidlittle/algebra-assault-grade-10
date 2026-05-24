/**
 * Sound Preference Utility — persists mute/unmute state via window.storage.
 *
 * Storage key: 'sound-preference'
 * Default: true (sound enabled)
 *
 * Both functions are async and wrapped in try/catch — they never throw.
 */

const STORAGE_KEY = 'sound-preference';

/**
 * Load sound preference from storage.
 * @returns {Promise<boolean>} true = sound enabled, false = muted
 */
export async function loadSoundPreference() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (result && result.value != null) {
      return JSON.parse(result.value) === true;
    }
    return true;
  } catch (e) {
    return true;
  }
}

/**
 * Save sound preference to storage.
 * @param {boolean} enabled - true = sound enabled, false = muted
 */
export async function saveSoundPreference(enabled) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(enabled));
  } catch (e) {
    // Silently fail — preference will default to enabled on next load
  }
}
