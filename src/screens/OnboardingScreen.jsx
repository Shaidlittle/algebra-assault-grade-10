import React, { useState } from 'react';
import { createProfile, setActiveProfile } from '../utils/profileManager.js';

/**
 * Validates a name for the onboarding form.
 * Rules:
 * - Trim leading/trailing whitespace
 * - Min 1 char, max 20 chars (after trim)
 * - Only letters (A-Z, a-z), hyphens, apostrophes, spaces
 * - Must not be empty after trim
 *
 * @param {string} name - Raw name input
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(name) {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Please enter your name' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Please enter your name' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Name must be 20 characters or fewer' };
  }

  // Only allow letters, hyphens, apostrophes, and spaces
  if (!/^[A-Za-z '\-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, hyphens, apostrophes, and spaces' };
  }

  return { valid: true };
}

/**
 * Validates the curriculum selection.
 *
 * @param {string} curriculum - Selected curriculum value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCurriculum(curriculum) {
  const validOptions = ['caps', 'ieb', 'cambridge'];
  if (!curriculum || !validOptions.includes(curriculum)) {
    return { valid: false, error: 'Please select a curriculum' };
  }
  return { valid: true };
}

const CURRICULUM_OPTIONS = [
  { value: 'caps', label: 'CAPS', description: 'South African National Curriculum' },
  { value: 'ieb', label: 'IEB', description: 'Independent Examinations Board' },
  { value: 'cambridge', label: 'Cambridge', description: 'Cambridge International' },
];

/**
 * OnboardingScreen — first-launch experience that collects student name and curriculum.
 *
 * @param {{ onComplete: () => void }} props
 */
export function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [nameError, setNameError] = useState('');
  const [curriculumError, setCurriculumError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStorageError('');

    // Validate name
    const nameResult = validateName(name);
    const currResult = validateCurriculum(curriculum);

    setNameError(nameResult.valid ? '' : nameResult.error);
    setCurriculumError(currResult.valid ? '' : currResult.error);

    if (!nameResult.valid || !currResult.valid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createProfile(name.trim(), curriculum);

      if (!result.success) {
        setStorageError(result.error || 'Could not save profile. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const activeResult = await setActiveProfile(result.profile.id);

      if (!activeResult.success) {
        setStorageError(activeResult.error || 'Could not set active profile. Please try again.');
        setIsSubmitting(false);
        return;
      }

      onComplete();
    } catch (err) {
      setStorageError('Could not save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 mb-3 bg-purple-500/20 border border-purple-400 rounded-full text-purple-300 text-[10px] font-bold tracking-widest">
            WELCOME ABOARD
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
            Let's Set Up Your Profile
          </h2>
          <p className="text-slate-400 text-sm">
            Tell us your name and curriculum so we can personalize your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name Input */}
          <div className="mb-5">
            <label htmlFor="onboarding-name" className="block text-sm font-bold text-cyan-300 mb-1.5">
              Your First Name
            </label>
            <input
              id="onboarding-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="Enter your name"
              maxLength={20}
              autoComplete="given-name"
              className={`w-full px-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all ${
                nameError ? 'border-red-400/70' : 'border-slate-600/50 focus:border-cyan-400/70'
              }`}
            />
            {nameError && (
              <p className="mt-1.5 text-red-400 text-xs font-medium" role="alert">
                {nameError}
              </p>
            )}
          </div>

          {/* Curriculum Selector */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-cyan-300 mb-1.5">
              Your Curriculum
            </label>
            <div className="grid grid-cols-1 gap-2">
              {CURRICULUM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setCurriculum(option.value);
                    if (curriculumError) setCurriculumError('');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all touch-manipulation ${
                    curriculum === option.value
                      ? 'border-cyan-400 bg-cyan-400/10 text-white'
                      : 'border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-bold text-sm">{option.label}</span>
                  <span className="block text-xs text-slate-400 mt-0.5">{option.description}</span>
                </button>
              ))}
            </div>
            {curriculumError && (
              <p className="mt-1.5 text-red-400 text-xs font-medium" role="alert">
                {curriculumError}
              </p>
            )}
          </div>

          {/* Storage Error */}
          {storageError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/50 rounded-xl" role="alert">
              <p className="text-red-300 text-sm font-medium">{storageError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg py-3.5 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation"
          >
            {isSubmitting ? 'Setting up...' : "Let's Go!"}
          </button>
        </form>

        <div className="text-center text-slate-500 text-[11px] mt-4">
          MathCoach · Algebra Assault · Grade 10
        </div>
      </div>
    </div>
  );
}
