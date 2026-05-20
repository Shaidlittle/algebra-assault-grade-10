import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createEventDispatcher } from './eventDispatcher.js';

/**
 * **Validates: Requirements 14.2, 14.3, 14.6**
 */

describe('Event Dispatcher', () => {
  describe('14.2: Event dispatch delivers collision events individually with correct shape', () => {
    it('each emitted event is delivered to typed listeners with the exact event object', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom('damage', 'waveComplete', 'kill', 'nuke'),
            amount: fc.integer({ min: 1, max: 100 }),
            source: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          (event) => {
            const dispatcher = createEventDispatcher();
            const received = [];
            dispatcher.on(event.type, (e) => received.push(e));
            dispatcher.emit(event);

            expect(received).toHaveLength(1);
            expect(received[0]).toBe(event);
            expect(received[0].type).toBe(event.type);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('events are delivered individually (not batched) to each listener', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom('damage', 'waveComplete', 'kill', 'nuke'),
              id: fc.integer(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (events) => {
            const dispatcher = createEventDispatcher();
            const received = [];
            dispatcher.onAny((e) => received.push(e));

            for (const event of events) {
              dispatcher.emit(event);
            }

            expect(received).toHaveLength(events.length);
            for (let i = 0; i < events.length; i++) {
              expect(received[i]).toBe(events[i]);
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('14.3: Wave completion dispatches event', () => {
    it('waveComplete events are delivered to typed listeners with waveNumber', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (waveNumber) => {
            const dispatcher = createEventDispatcher();
            const received = [];
            dispatcher.on('waveComplete', (e) => received.push(e));

            dispatcher.emit({ type: 'waveComplete', waveNumber });

            expect(received).toHaveLength(1);
            expect(received[0].type).toBe('waveComplete');
            expect(received[0].waveNumber).toBe(waveNumber);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('14.6: Immediate game-over on lethal damage (dispatcher pattern)', () => {
    it('damage events are delivered synchronously (no queue delay)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (amount, source) => {
            const dispatcher = createEventDispatcher();
            let receivedDuringEmit = false;

            dispatcher.on('damage', () => {
              receivedDuringEmit = true;
            });

            // The listener should fire synchronously during emit
            receivedDuringEmit = false;
            dispatcher.emit({ type: 'damage', amount, source });
            expect(receivedDuringEmit).toBe(true);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('multiple damage listeners all fire synchronously on single emit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 200 }),
          (listenerCount, amount) => {
            const dispatcher = createEventDispatcher();
            let callCount = 0;

            for (let i = 0; i < listenerCount; i++) {
              dispatcher.on('damage', () => { callCount++; });
            }

            dispatcher.emit({ type: 'damage', amount, source: 'test' });
            expect(callCount).toBe(listenerCount);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
