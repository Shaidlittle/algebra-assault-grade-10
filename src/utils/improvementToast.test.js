import { describe, it, expect } from 'vitest';
import { checkImprovementToast, checkStreakRecord } from './improvementToast.js';

describe('checkImprovementToast', () => {
  it('returns show:true when accuracy improves by exactly 10 percentage points', () => {
    const progressData = {
      perTopicAccuracy: { linear: 50 },
      totalQuestions: 20,
      perTopicQuestions: { linear: 15 }
    };
    const result = checkImprovementToast(progressData, 'linear', 60);
    expect(result.show).toBe(true);
    expect(result.message).toBe('Your linear accuracy improved by 10%!');
    expect(result.type).toBe('accuracy');
  });

  it('returns show:true when accuracy improves by more than 10 percentage points', () => {
    const progressData = {
      perTopicAccuracy: { quadratic: 40 },
      totalQuestions: 30,
      perTopicQuestions: { quadratic: 12 }
    };
    const result = checkImprovementToast(progressData, 'quadratic', 65);
    expect(result.show).toBe(true);
    expect(result.message).toBe('Your quadratic accuracy improved by 25%!');
  });

  it('returns show:false when improvement is less than 10 percentage points', () => {
    const progressData = {
      perTopicAccuracy: { linear: 50 },
      totalQuestions: 20,
      perTopicQuestions: { linear: 15 }
    };
    const result = checkImprovementToast(progressData, 'linear', 55);
    expect(result.show).toBe(false);
  });

  it('returns show:false when accuracy decreased', () => {
    const progressData = {
      perTopicAccuracy: { linear: 70 },
      totalQuestions: 20,
      perTopicQuestions: { linear: 15 }
    };
    const result = checkImprovementToast(progressData, 'linear', 60);
    expect(result.show).toBe(false);
  });

  it('returns show:false when fewer than 10 questions answered for topic', () => {
    const progressData = {
      perTopicAccuracy: { linear: 30 },
      totalQuestions: 8,
      perTopicQuestions: { linear: 8 }
    };
    const result = checkImprovementToast(progressData, 'linear', 80);
    expect(result.show).toBe(false);
  });

  it('returns show:false when topic does not exist in perTopicAccuracy', () => {
    const progressData = {
      perTopicAccuracy: { linear: 50 },
      totalQuestions: 20,
      perTopicQuestions: { linear: 15 }
    };
    const result = checkImprovementToast(progressData, 'quadratic', 80);
    expect(result.show).toBe(false);
  });

  it('returns show:false when progressData is null', () => {
    const result = checkImprovementToast(null, 'linear', 80);
    expect(result.show).toBe(false);
  });

  it('returns show:false when topic is empty', () => {
    const progressData = {
      perTopicAccuracy: { linear: 50 },
      totalQuestions: 20
    };
    const result = checkImprovementToast(progressData, '', 80);
    expect(result.show).toBe(false);
  });

  it('works without perTopicQuestions field (uses perTopicAccuracy existence check)', () => {
    const progressData = {
      perTopicAccuracy: { linear: 40 },
      totalQuestions: 20
    };
    const result = checkImprovementToast(progressData, 'linear', 55);
    expect(result.show).toBe(true);
    expect(result.message).toBe('Your linear accuracy improved by 15%!');
  });

  it('rounds improvement to nearest integer in message', () => {
    const progressData = {
      perTopicAccuracy: { linear: 45.5 },
      totalQuestions: 20,
      perTopicQuestions: { linear: 10 }
    };
    const result = checkImprovementToast(progressData, 'linear', 56.3);
    expect(result.show).toBe(true);
    expect(result.message).toBe('Your linear accuracy improved by 11%!');
  });
});

describe('checkStreakRecord', () => {
  it('returns show:true when current streak exceeds previous best', () => {
    const result = checkStreakRecord(8, 7);
    expect(result.show).toBe(true);
    expect(result.message).toBe('New personal best: 8 correct in a row!');
    expect(result.type).toBe('streak');
  });

  it('returns show:false when current streak equals previous best', () => {
    const result = checkStreakRecord(5, 5);
    expect(result.show).toBe(false);
  });

  it('returns show:false when current streak is less than previous best', () => {
    const result = checkStreakRecord(3, 7);
    expect(result.show).toBe(false);
  });

  it('returns show:true for first streak (previous best is 0)', () => {
    const result = checkStreakRecord(1, 0);
    expect(result.show).toBe(true);
    expect(result.message).toBe('New personal best: 1 correct in a row!');
  });

  it('returns show:false when both are 0', () => {
    const result = checkStreakRecord(0, 0);
    expect(result.show).toBe(false);
  });
});
