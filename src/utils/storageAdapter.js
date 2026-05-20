/**
 * StorageAdapter — wraps window.storage with a namespace prefix.
 * All existing modules call through this instead of window.storage directly.
 *
 * @param {string} namespacePrefix - The namespace prefix for all storage keys
 * @returns {{ get, set, delete, list, getFullKey }}
 */
export function createStorageAdapter(namespacePrefix) {
  /**
   * Builds the full namespaced key: `{namespace}-{key}`
   * @param {string} key
   * @returns {string}
   */
  function getFullKey(key) {
    return `${namespacePrefix}-${key}`;
  }

  /**
   * Get a value from storage by namespaced key.
   * @param {string} key
   * @returns {Promise<{key: string, value: string} | null>}
   */
  async function get(key) {
    try {
      const fullKey = getFullKey(key);
      const result = await window.storage.get(fullKey);
      return result;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set a value in storage under the namespaced key.
   * @param {string} key
   * @param {string} value
   * @returns {Promise<{key: string, value: string} | null>}
   */
  async function set(key, value) {
    try {
      const fullKey = getFullKey(key);
      const result = await window.storage.set(fullKey, value);
      return result;
    } catch (e) {
      return null;
    }
  }

  /**
   * Delete a value from storage by namespaced key.
   * @param {string} key
   * @returns {Promise<{key: string, deleted: boolean} | null>}
   */
  async function del(key) {
    try {
      const fullKey = getFullKey(key);
      const result = await window.storage.delete(fullKey);
      return result;
    } catch (e) {
      return null;
    }
  }

  /**
   * List all keys in storage matching the namespaced prefix + optional sub-prefix.
   * @param {string} [prefix='']
   * @returns {Promise<{keys: string[]} | null>}
   */
  async function list(prefix = '') {
    try {
      const fullPrefix = getFullKey(prefix);
      const result = await window.storage.list(fullPrefix);
      return result;
    } catch (e) {
      return null;
    }
  }

  return {
    get,
    set,
    delete: del,
    list,
    getFullKey,
  };
}
