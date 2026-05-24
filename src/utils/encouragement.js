/**
 * Encouragement system for Algebra Assault.
 * Provides motivational messages to support students when they make mistakes,
 * celebrate comebacks, and acknowledge streaks.
 */

/**
 * Pool of at least 20 unique motivational messages across categories.
 * Each message has an id, text, and category.
 */
export const ENCOURAGEMENT_POOL = [
  // General encouragement (shown on wrong answers)
  { id: 'gen-01', text: "You're getting closer! Keep working through it.", category: 'general' },
  { id: 'gen-02', text: "Mistakes help you learn — every wrong answer teaches you something.", category: 'general' },
  { id: 'gen-03', text: "Don't give up! You're building understanding with every attempt.", category: 'general' },
  { id: 'gen-04', text: "Math takes practice. You're doing the hard work right now.", category: 'general' },
  { id: 'gen-05', text: "Almost there! Try looking at it from a different angle.", category: 'general' },
  { id: 'gen-06', text: "Every expert was once a beginner. Keep going!", category: 'general' },
  { id: 'gen-07', text: "You're training your brain — this is how growth happens.", category: 'general' },
  { id: 'gen-08', text: "It's okay to struggle. That's where real learning happens.", category: 'general' },
  { id: 'gen-09', text: "Stay curious — the solution is within your reach.", category: 'general' },
  { id: 'gen-10', text: "Progress isn't always a straight line. You've got this!", category: 'general' },
  { id: 'gen-11', text: "Each attempt makes you stronger at algebra.", category: 'general' },
  { id: 'gen-12', text: "You're braver than you think for tackling this problem.", category: 'general' },

  // Comeback messages (shown when correct after wrong streak)
  { id: 'cmb-01', text: "Great comeback! You figured it out!", category: 'comeback' },
  { id: 'cmb-02', text: "You bounced back! That persistence paid off.", category: 'comeback' },
  { id: 'cmb-03', text: "There it is! You pushed through and got it right.", category: 'comeback' },
  { id: 'cmb-04', text: "Nice recovery! You didn't let those mistakes stop you.", category: 'comeback' },
  { id: 'cmb-05', text: "That's the spirit! You turned it around.", category: 'comeback' },

  // Streak celebration messages (shown on 5+ correct streak)
  { id: 'str-01', text: "You're on fire! Keep that streak going!", category: 'streak' },
  { id: 'str-02', text: "Amazing streak! You're really getting the hang of this.", category: 'streak' },
  { id: 'str-03', text: "Unstoppable! Your hard work is showing.", category: 'streak' },
  { id: 'str-04', text: "Look at you go! That's some serious algebra skill.", category: 'streak' },
  { id: 'str-05', text: "On a roll! Nothing can stop you now.", category: 'streak' },
];

/**
 * Get a random motivational message, avoiding consecutive repeats.
 * @param {string|null} lastMessageId - ID of the previously shown message
 * @returns {{ id: string, message: string, category: string }}
 */
export function getEncouragementMessage(lastMessageId) {
  const generalMessages = ENCOURAGEMENT_POOL.filter(m => m.category === 'general');
  const available = lastMessageId
    ? generalMessages.filter(m => m.id !== lastMessageId)
    : generalMessages;

  // If somehow all are filtered (shouldn't happen with 12+ messages), fall back to full list
  const pool = available.length > 0 ? available : generalMessages;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return { id: selected.id, message: selected.text, category: selected.category };
}

/**
 * Get a "comeback" message for recovering from a wrong streak.
 * @returns {{ id: string, message: string, category: string }}
 */
export function getComebackMessage() {
  const comebackMessages = ENCOURAGEMENT_POOL.filter(m => m.category === 'comeback');
  const selected = comebackMessages[Math.floor(Math.random() * comebackMessages.length)];

  return { id: selected.id, message: selected.text, category: selected.category };
}

/**
 * Get a streak celebration message.
 * @param {number} streakLength - Current correct streak length
 * @returns {{ id: string, message: string, category: string }}
 */
export function getStreakCelebration(streakLength) {
  const streakMessages = ENCOURAGEMENT_POOL.filter(m => m.category === 'streak');
  const selected = streakMessages[Math.floor(Math.random() * streakMessages.length)];

  const message = `${streakLength} in a row! ${selected.text}`;

  return { id: selected.id, message, category: selected.category };
}
