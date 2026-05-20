// Canvas dimensions
export const W = 400;
export const H = 600;

// HP system
export const MAX_HP = 100;
export const DMG_BULLET = 12;
export const DMG_ALIEN = 22;
export const DMG_BOSS_BULLET = 18;
export const DMG_WRONG = 25;
export const HEALTH_RESTORE = 30;
export const HP_CORRECT_BONUS = 18;

// Wave settings
export const WAVES_BEFORE_BOSS = 4;
export const ALIENS_PER_WAVE = 10;

// Boss settings
export const BOSS_HP = 3;
export const ULTIMATE_BOSS_HP = 3;
export const BOSS_PHASE_HP = 20;
export const ULTIMATE_BOSS_PHASE_HP = 30;

// Power-up configuration
export const POWERUP_DROP_CHANCE = 0.18;
export const POWERUP_DURATIONS = { shield: 6000, rapid: 8000, triple: 8000 };
export const BOSS_SHIELD_DURATION = 5000;
export const POWERUP_INFO = {
  shield:  { name: 'Shield',     color: '#3b82f6', glow: '#60a5fa', symbol: 'S' },
  rapid:   { name: 'Rapid Fire', color: '#fbbf24', glow: '#fde047', symbol: 'R' },
  triple:  { name: 'Triple Shot',color: '#a855f7', glow: '#c084fc', symbol: 'T' },
  health:  { name: '+30 HP',     color: '#10b981', glow: '#34d399', symbol: '+' },
  nuke:    { name: 'Nuke',       color: '#f97316', glow: '#fb923c', symbol: 'N' },
};
export const POWERUP_TYPES = Object.keys(POWERUP_INFO);

// Exam settings
export const EXAM_TIMER_SECONDS = 25;
export const EXAM_QUESTION_COUNT = 10;
export const EXAM_LIVES = 3;
export const EXAM_LOW_TIMER = 10;
export const EXAM_CRITICAL_TIMER = 5;

// Derived helpers
export const getMaxBossHp = (t) => t === 'ultimate' ? ULTIMATE_BOSS_HP : BOSS_HP;
export const getBossPhaseHp = (t) => t === 'ultimate' ? ULTIMATE_BOSS_PHASE_HP : BOSS_PHASE_HP;
