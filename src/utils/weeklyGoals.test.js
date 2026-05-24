import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  COSMETIC_REWARDS,
  getCurrentWeekStart,
  checkWeekReset,
  updateGoalProgress,
  checkGoalCompletion,
  loadWeeklyGoals,
  saveWeeklyGoals,
  setNamespace,
} from './weeklyGoals.js';

describe('weeklyGoals', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
    };
    window.storage = mockStorage;
    // Reset namespace to default before each test
    setNamespace('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('COSMETIC_REWARDS', () => {
    it('contains exactly 12 rewards', () => {
      expect(COSMETIC_REWARDS).toHaveLength(12);
    });

    it('each reward has id, name, type, and value', () => {
      for (const reward of COSMETIC_REWARDS) {
        expect(reward).toHaveProperty('id');
        expect(reward).toHaveProperty('name');
        expect(reward).toHaveProperty('type');
        expect(reward).toHaveProperty('value');
        expect(['skin', 'trail']).toContain(reward.type);
        expect(reward.value).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('all reward ids are unique', () => {
      const ids = COSMETIC_REWARDS.map((r) => r.id);
      expect(new Set(ids).size).toBe(12);
    });

    it('contains both skin and trail types', () => {
      const skins = COSMETIC_REWARDS.filter((r) => r.type === 'skin');
      const trails = COSMETIC_REWARDS.filter((r) => r.type === 'trail');
      expect(skins.length).toBeGreaterThan(0);
      expect(trails.length).toBeGreaterThan(0);
    });
  });

  describe('getCurrentWeekStart', () => {
    it('returns an ISO date string', () => {
      const result = getCurrentWeekStart();
      expect(() => new Date(result)).not.toThrow();
      expect(new Date(result).toISOString()).toBe(result);
    });

    it('returns a Monday', () => {
      const result = getCurrentWeekStart();
      const date = new Date(result);
      expect(date.getDay()).toBe(1);
    });

    it('returns midnight (hours/minutes/seconds are zero)', () => {
      const result = getCurrentWeekStart();
      const date = new Date(result);
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      expect(localDate.getHours()).toBe(0);
      expect(localDate.getMinutes()).toBe(0);
      expect(localDate.getSeconds()).toBe(0);
    });
  });

  describe('checkWeekReset', () => {
    it('returns state unchanged if weekStart matches current week', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 10, sessionsStarted: 2, dailyChallengesCompleted: 1 },
        unlockedRewards: ['skin-flame'],
        completed: false,
      };

      const result = checkWeekReset(state);
      expect(result).toEqual(state);
    });

    it('resets progress and updates weekStart if weekStart is from a previous week', () => {
      const oldMonday = '2020-01-06T00:00:00.000Z';
      const state = {
        weekStart: oldMonday,
        progress: { questionsCorrect: 45, sessionsStarted: 4, dailyChallengesCompleted: 2 },
        unlockedRewards: ['skin-flame', 'trail-purple'],
        completed: true,
      };

      const result = checkWeekReset(state);
      expect(result.weekStart).toBe(getCurrentWeekStart());
      expect(result.progress).toEqual({
        questionsCorrect: 0,
        sessionsStarted: 0,
        dailyChallengesCompleted: 0,
      });
      expect(result.completed).toBe(false);
      expect(result.unlockedRewards).toEqual(['skin-flame', 'trail-purple']);
    });
  });

  describe('updateGoalProgress', () => {
    it('increments questionsCorrect via questionCorrect action', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 10, sessionsStarted: 2, dailyChallengesCompleted: 1 },
        unlockedRewards: [],
        completed: false,
      };

      const result = updateGoalProgress(state, 'questionCorrect', 5);
      expect(result.progress.questionsCorrect).toBe(15);
      expect(result.progress.sessionsStarted).toBe(2);
      expect(result.progress.dailyChallengesCompleted).toBe(1);
    });

    it('increments sessionsStarted via sessionStarted action', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 0, sessionsStarted: 0, dailyChallengesCompleted: 0 },
        unlockedRewards: [],
        completed: false,
      };

      const result = updateGoalProgress(state, 'sessionStarted', 1);
      expect(result.progress.sessionsStarted).toBe(1);
    });

    it('increments dailyChallengesCompleted via dailyChallengeCompleted action', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 0, sessionsStarted: 0, dailyChallengesCompleted: 0 },
        unlockedRewards: [],
        completed: false,
      };

      const result = updateGoalProgress(state, 'dailyChallengeCompleted', 1);
      expect(result.progress.dailyChallengesCompleted).toBe(1);
    });

    it('also accepts direct field names for backward compatibility', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 10, sessionsStarted: 2, dailyChallengesCompleted: 1 },
        unlockedRewards: [],
        completed: false,
      };

      const result = updateGoalProgress(state, 'questionsCorrect', 3);
      expect(result.progress.questionsCorrect).toBe(13);
    });

    it('returns state unchanged for unknown action', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 10, sessionsStarted: 2, dailyChallengesCompleted: 1 },
        unlockedRewards: [],
        completed: false,
      };

      const result = updateGoalProgress(state, 'unknownAction', 5);
      expect(result).toEqual(state);
    });

    it('does not mutate the original state', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 10, sessionsStarted: 2, dailyChallengesCompleted: 1 },
        unlockedRewards: [],
        completed: false,
      };

      const result = updateGoalProgress(state, 'questionCorrect', 5);
      expect(state.progress.questionsCorrect).toBe(10);
      expect(result).not.toBe(state);
    });
  });

  describe('checkGoalCompletion', () => {
    it('returns completed: false with null reward and 0 bonusXP when not all objectives are met', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 49, sessionsStarted: 5, dailyChallengesCompleted: 3 },
        unlockedRewards: [],
        completed: false,
      };

      const result = checkGoalCompletion(state);
      expect(result.completed).toBe(false);
      expect(result.reward).toBeNull();
      expect(result.bonusXP).toBe(0);
    });

    it('returns completed: false when already completed this week', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 50, sessionsStarted: 5, dailyChallengesCompleted: 3 },
        unlockedRewards: ['skin-flame'],
        completed: true,
      };

      const result = checkGoalCompletion(state);
      expect(result.completed).toBe(false);
      expect(result.reward).toBeNull();
      expect(result.bonusXP).toBe(0);
    });

    it('returns completed: true with next reward when objectives met and rewards < 12', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 50, sessionsStarted: 5, dailyChallengesCompleted: 3 },
        unlockedRewards: [],
        completed: false,
      };

      const result = checkGoalCompletion(state);
      expect(result.completed).toBe(true);
      expect(result.reward).toEqual(COSMETIC_REWARDS[0]);
      expect(result.bonusXP).toBe(0);
    });

    it('returns completed: true with 200 bonusXP when all 12 rewards unlocked', () => {
      const allRewardIds = COSMETIC_REWARDS.map((r) => r.id);
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 50, sessionsStarted: 5, dailyChallengesCompleted: 3 },
        unlockedRewards: allRewardIds,
        completed: false,
      };

      const result = checkGoalCompletion(state);
      expect(result.completed).toBe(true);
      expect(result.reward).toBeNull();
      expect(result.bonusXP).toBe(200);
    });

    it('awards the correct next reward based on unlocked count', () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 60, sessionsStarted: 7, dailyChallengesCompleted: 5 },
        unlockedRewards: ['skin-flame', 'trail-purple', 'skin-nebula'],
        completed: false,
      };

      const result = checkGoalCompletion(state);
      expect(result.completed).toBe(true);
      expect(result.reward).toEqual(COSMETIC_REWARDS[3]); // trail-gold
      expect(result.bonusXP).toBe(0);
    });
  });

  describe('setNamespace', () => {
    it('changes the storage key used by load/save', async () => {
      setNamespace('matteo');
      mockStorage.get.mockResolvedValue(null);

      await loadWeeklyGoals();
      expect(mockStorage.get).toHaveBeenCalledWith('matteo-weekly-goals');
    });

    it('uses default key when prefix is empty', async () => {
      setNamespace('');
      mockStorage.get.mockResolvedValue(null);

      await loadWeeklyGoals();
      expect(mockStorage.get).toHaveBeenCalledWith('weekly-goals');
    });

    it('uses prefixed key for save', async () => {
      setNamespace('player1');
      mockStorage.set.mockResolvedValue(undefined);

      await saveWeeklyGoals({ test: true });
      expect(mockStorage.set).toHaveBeenCalledWith('player1-weekly-goals', JSON.stringify({ test: true }));
    });
  });

  describe('loadWeeklyGoals', () => {
    it('returns parsed state from storage', async () => {
      const storedState = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 20, sessionsStarted: 3, dailyChallengesCompleted: 1 },
        unlockedRewards: ['skin-flame'],
        completed: false,
      };
      mockStorage.get.mockResolvedValue({ key: 'weekly-goals', value: JSON.stringify(storedState) });

      const result = await loadWeeklyGoals();
      expect(result).toEqual(storedState);
      expect(mockStorage.get).toHaveBeenCalledWith('weekly-goals');
    });

    it('returns default state when storage returns null', async () => {
      mockStorage.get.mockResolvedValue(null);

      const result = await loadWeeklyGoals();
      expect(result.weekStart).toBe(getCurrentWeekStart());
      expect(result.progress).toEqual({
        questionsCorrect: 0,
        sessionsStarted: 0,
        dailyChallengesCompleted: 0,
      });
      expect(result.unlockedRewards).toEqual([]);
      expect(result.completed).toBe(false);
    });

    it('returns default state when storage throws', async () => {
      mockStorage.get.mockRejectedValue(new Error('Storage error'));

      const result = await loadWeeklyGoals();
      expect(result.weekStart).toBe(getCurrentWeekStart());
      expect(result.progress.questionsCorrect).toBe(0);
    });

    it('returns default state when value is null', async () => {
      mockStorage.get.mockResolvedValue({ key: 'weekly-goals', value: null });

      const result = await loadWeeklyGoals();
      expect(result.weekStart).toBe(getCurrentWeekStart());
    });
  });

  describe('saveWeeklyGoals', () => {
    it('saves state as JSON string', async () => {
      const state = {
        weekStart: getCurrentWeekStart(),
        progress: { questionsCorrect: 10, sessionsStarted: 1, dailyChallengesCompleted: 0 },
        unlockedRewards: [],
        completed: false,
      };
      mockStorage.set.mockResolvedValue({ key: 'weekly-goals', value: JSON.stringify(state) });

      await saveWeeklyGoals(state);

      expect(mockStorage.set).toHaveBeenCalledWith('weekly-goals', JSON.stringify(state));
    });

    it('does not throw when storage throws', async () => {
      mockStorage.set.mockRejectedValue(new Error('Quota exceeded'));

      await expect(saveWeeklyGoals({})).resolves.toBeUndefined();
    });
  });
});
