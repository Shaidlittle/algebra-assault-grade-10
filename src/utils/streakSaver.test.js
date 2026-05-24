import { describe, it, expect } from 'vitest';
import { updateStreakSaver, resetStreakSaver, STREAK_THRESHOLD } from './streakSaver.js';

describe('streakSaver', () => {
  describe('STREAK_THRESHOLD', () => {
    it('should be 3', () => {
      expect(STREAK_THRESHOLD).toBe(3);
    });
  });

  describe('resetStreakSaver', () => {
    it('should return initial state with consecutiveWrong = 0', () => {
      const state = resetStreakSaver();
      expect(state).toEqual({ consecutiveWrong: 0 });
    });
  });

  describe('updateStreakSaver', () => {
    it('should reset counter to 0 on correct answer', () => {
      const state = { consecutiveWrong: 2 };
      const result = updateStreakSaver(state, true);
      expect(result.newState).toEqual({ consecutiveWrong: 0 });
      expect(result.shouldActivate).toBe(false);
    });

    it('should increment counter on wrong answer', () => {
      const state = { consecutiveWrong: 0 };
      const result = updateStreakSaver(state, false);
      expect(result.newState).toEqual({ consecutiveWrong: 1 });
      expect(result.shouldActivate).toBe(false);
    });

    it('should not activate at 2 consecutive wrong answers', () => {
      const state = { consecutiveWrong: 1 };
      const result = updateStreakSaver(state, false);
      expect(result.newState).toEqual({ consecutiveWrong: 2 });
      expect(result.shouldActivate).toBe(false);
    });

    it('should activate at 3 consecutive wrong answers and reset counter', () => {
      const state = { consecutiveWrong: 2 };
      const result = updateStreakSaver(state, false);
      expect(result.newState).toEqual({ consecutiveWrong: 0 });
      expect(result.shouldActivate).toBe(true);
    });

    it('should activate again after another 3 wrong answers post-reset', () => {
      let state = resetStreakSaver();

      // 3 wrong answers → activate
      state = updateStreakSaver(state, false).newState;
      state = updateStreakSaver(state, false).newState;
      const firstActivation = updateStreakSaver(state, false);
      expect(firstActivation.shouldActivate).toBe(true);
      state = firstActivation.newState;

      // Another 3 wrong answers → activate again
      state = updateStreakSaver(state, false).newState;
      state = updateStreakSaver(state, false).newState;
      const secondActivation = updateStreakSaver(state, false);
      expect(secondActivation.shouldActivate).toBe(true);
      expect(secondActivation.newState).toEqual({ consecutiveWrong: 0 });
    });

    it('should not activate if a correct answer interrupts the streak', () => {
      let state = { consecutiveWrong: 0 };

      state = updateStreakSaver(state, false).newState; // 1 wrong
      state = updateStreakSaver(state, false).newState; // 2 wrong
      state = updateStreakSaver(state, true).newState;  // correct → reset
      state = updateStreakSaver(state, false).newState; // 1 wrong
      state = updateStreakSaver(state, false).newState; // 2 wrong

      const result = updateStreakSaver(state, false);   // 3 wrong → activate
      expect(result.shouldActivate).toBe(true);
    });

    it('should not mutate the input state', () => {
      const state = { consecutiveWrong: 1 };
      updateStreakSaver(state, false);
      expect(state.consecutiveWrong).toBe(1);
    });
  });
});
