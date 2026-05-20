import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

// Constants
export const WEBHOOK_URL = 'https://formspree.io/f/xvzyznqz';
export const WEBHOOK_TIMEOUT_MS = 10000;
export const WORKBOOK_PATH = '/workbook.pdf';

/**
 * Validates an email address against the required pattern.
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * EmailCaptureModal — overlay that collects a parent/student email
 * in exchange for a free workbook download link.
 *
 * Props:
 *   onClose          — called when the modal is dismissed
 *   profileNamespace — active profile namespace for storing download flag
 */
export function EmailCaptureModal({ onClose, profileNamespace }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Capture the element that had focus before the modal opened
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    return () => {
      // Return focus to the previously focused element on unmount
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSubmitted(true);

    // Fire-and-forget POST to Formspree
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email,
        _subject: 'Algebra Assault — Parent Lead (Field Manual)',
        source: 'algebra-assault',
        type: 'parent-email',
      }),
      signal: controller.signal,
    })
      .catch(() => {
        // Silently ignore — fire-and-forget
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
  };

  const handleClose = () => {
    onClose();
  };

  const handleDownloadClick = () => {
    // Store workbook-downloaded flag in active profile namespace
    if (profileNamespace && window.storage && window.storage.set) {
      window.storage.set(`${profileNamespace}-workbook-downloaded`, 'true');
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-capture-title"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-400/50 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 my-auto relative">
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2
          id="email-capture-title"
          className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight"
        >
          📘 Free Field Manual
        </h2>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <p className="text-slate-300 text-sm mb-4">
              Parents — get the Algebra Assault Field Manual for your child. 29 pages of worked examples, common traps, and exam-style practice. Enter your email to unlock the download.
            </p>

            <div className="mb-3">
              <label htmlFor="parent-email" className="block text-xs font-bold text-cyan-300 mb-1.5">Parent's Email</label>
              <input
                id="parent-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="parent@example.com"
                className="w-full bg-slate-700/60 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                aria-describedby={error ? 'email-error' : undefined}
                aria-invalid={error ? 'true' : 'false'}
              />
              {error && (
                <p id="email-error" className="text-red-400 text-xs mt-1.5" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-black text-base py-3 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation"
            >
              Send My Workbook
            </button>

            <p className="text-slate-500 text-xs mt-3 text-center">
              🔒 Your email will not be shared with anyone.
            </p>
          </form>
        ) : (
          <div>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-white font-bold text-lg">Your Field Manual is ready!</p>
              <p className="text-slate-300 text-sm mt-2">
                The Algebra Assault Field Manual — 5 missions, worked examples, drills, and boss battles.
              </p>
            </div>

            <a
              href={WORKBOOK_PATH}
              onClick={handleDownloadClick}
              download
              className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 active:scale-95 text-white font-black text-base py-3 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation mb-3"
            >
              ⬇️ Download Field Manual (PDF)
            </a>

            <button
              onClick={handleClose}
              className="w-full text-slate-400 hover:text-white text-sm font-medium py-2 transition-colors"
            >
              Back to Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
