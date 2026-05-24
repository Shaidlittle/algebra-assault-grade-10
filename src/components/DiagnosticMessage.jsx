/**
 * Renders a diagnostic feedback message for a wrong answer.
 * @param {{ message: string }} props
 * @returns {JSX.Element|null}
 */
export function DiagnosticMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-2 mb-3">
      <span className="text-lg flex-shrink-0">💡</span>
      <p className="text-sm sm:text-base text-amber-100 font-medium leading-snug">
        {message}
      </p>
    </div>
  );
}
