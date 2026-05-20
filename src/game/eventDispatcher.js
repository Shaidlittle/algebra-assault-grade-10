/**
 * Event Dispatcher — synchronous pub/sub for game engine events.
 *
 * Supported event types: "damage", "waveComplete", "kill", "nuke"
 * Event shape: { type: string, ...payload }
 */

const SUPPORTED_EVENTS = ['damage', 'waveComplete', 'kill', 'nuke'];

/**
 * Creates a new event dispatcher instance.
 * Events are delivered synchronously — no queue, no batching.
 *
 * @returns {{ on: (eventType: string, callback: Function) => void, onAny: (callback: Function) => void, emit: (event: { type: string }) => void }}
 */
export function createEventDispatcher() {
  const listeners = {};
  const anyListeners = [];

  // Initialize listener arrays for supported event types
  for (const type of SUPPORTED_EVENTS) {
    listeners[type] = [];
  }

  return {
    /**
     * Register a listener for a specific event type.
     * @param {string} eventType - One of the supported event types
     * @param {Function} callback - Called synchronously with the event object
     */
    on(eventType, callback) {
      if (!listeners[eventType]) {
        listeners[eventType] = [];
      }
      listeners[eventType].push(callback);
    },

    /**
     * Register a listener that receives all events regardless of type.
     * @param {Function} callback - Called synchronously with the event object
     */
    onAny(callback) {
      anyListeners.push(callback);
    },

    /**
     * Emit an event synchronously to all registered listeners.
     * Typed listeners are called first, then catch-all listeners.
     * @param {{ type: string }} event - Event object with type and payload
     */
    emit(event) {
      const typed = listeners[event.type];
      if (typed) {
        for (let i = 0; i < typed.length; i++) {
          typed[i](event);
        }
      }
      for (let i = 0; i < anyListeners.length; i++) {
        anyListeners[i](event);
      }
    }
  };
}
