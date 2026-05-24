/**
 * EncouragementBanner — inline encouragement message display.
 * Renders below the answer feedback area without blocking the student
 * from proceeding to the next question.
 *
 * @param {Object} props
 * @param {string} props.message - The motivational text to display
 * @param {'encouragement'|'comeback'|'streak'} props.type - Visual variant
 * @returns {JSX.Element|null}
 */
export function EncouragementBanner({ message, type = 'encouragement' }) {
  if (!message) return null;

  const styles = {
    encouragement: {
      container: 'bg-amber-500/15 border-amber-400/40 text-amber-100',
      emoji: '💪',
    },
    comeback: {
      container: 'bg-green-500/15 border-green-400/40 text-green-100',
      emoji: '🎉',
    },
    streak: {
      container: 'bg-purple-500/15 border-purple-400/40 text-purple-100',
      emoji: '🔥',
    },
  };

  const variant = styles[type] || styles.encouragement;

  return (
    <div
      className={`flex items-center gap-2 border rounded-xl px-3 py-2 mt-2 ${variant.container}`}
      role="status"
      aria-live="polite"
    >
      <span className="text-lg flex-shrink-0">{variant.emoji}</span>
      <p className="text-sm sm:text-base font-medium leading-snug">
        {message}
      </p>
    </div>
  );
}
