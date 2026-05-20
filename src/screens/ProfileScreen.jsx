import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Trash2, RefreshCw } from 'lucide-react';
import {
  loadProfiles,
  createProfile,
  deleteProfile,
  switchProfile,
  getActiveProfile,
  isProfileLimitReached,
  hasNamespaceCollision,
  deriveNamespace,
  sanitizeName,
} from '../utils/profileManager.js';

const CURRICULUM_OPTIONS = [
  { value: 'caps', label: 'CAPS', description: 'South African National Curriculum' },
  { value: 'ieb', label: 'IEB', description: 'Independent Examinations Board' },
  { value: 'cambridge', label: 'Cambridge', description: 'Cambridge International' },
];

/**
 * ProfileScreen — multi-profile management UI.
 * Lists profiles, allows create/switch/delete with validation and error handling.
 *
 * @param {{ onBack: () => void, onSwitch: (profile: object) => void, activeProfileId: string|null }} props
 */
export function ProfileScreen({ onBack, onSwitch, activeProfileId }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCurriculum, setNewCurriculum] = useState('');
  const [nameError, setNameError] = useState('');
  const [curriculumError, setCurriculumError] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline namespace collision check
  const [namespaceWarning, setNamespaceWarning] = useState('');

  // Load profiles on mount
  useEffect(() => {
    refreshProfiles();
  }, []);

  const refreshProfiles = async () => {
    setLoading(true);
    setError('');
    try {
      const loaded = await loadProfiles();
      setProfiles(loaded);
    } catch (e) {
      setError('Could not load profiles. Please try again.');
    }
    setLoading(false);
  };

  // Inline validation for namespace collisions
  const handleNameChange = (value) => {
    setNewName(value);
    if (nameError) setNameError('');
    if (namespaceWarning) setNamespaceWarning('');

    const sanitized = sanitizeName(value);
    if (sanitized) {
      const namespace = deriveNamespace(sanitized);
      if (namespace.length > 0 && hasNamespaceCollision(namespace, profiles)) {
        setNamespaceWarning('A profile with this name already exists');
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setNamespaceWarning('');

    // Validate name
    const trimmed = newName.trim();
    let hasError = false;

    if (trimmed.length === 0) {
      setNameError('Please enter a name');
      hasError = true;
    } else if (trimmed.length > 30) {
      setNameError('Name must be 30 characters or fewer');
      hasError = true;
    } else {
      setNameError('');
    }

    if (!newCurriculum) {
      setCurriculumError('Please select a curriculum');
      hasError = true;
    } else {
      setCurriculumError('');
    }

    if (hasError) return;

    // Check namespace collision before creating
    const sanitized = sanitizeName(newName);
    if (sanitized) {
      const namespace = deriveNamespace(sanitized);
      if (namespace.length === 0) {
        setNameError('Name must contain at least one letter or number');
        return;
      }
      if (hasNamespaceCollision(namespace, profiles)) {
        setNameError('A profile with this name already exists');
        return;
      }
    }

    setIsCreating(true);

    try {
      const result = await createProfile(newName.trim(), newCurriculum);

      if (!result.success) {
        setCreateError(result.error || 'Could not create profile. Please try again.');
        setIsCreating(false);
        return;
      }

      // Reset form and refresh
      setNewName('');
      setNewCurriculum('');
      setShowCreateForm(false);
      await refreshProfiles();
    } catch (err) {
      setCreateError('Could not create profile. Please try again.');
    }

    setIsCreating(false);
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    setError('');

    try {
      const result = await deleteProfile(id);

      if (!result.success) {
        setError(result.error || 'Could not delete profile. Please try again.');
        setIsDeleting(false);
        setDeleteConfirmId(null);
        return;
      }

      setDeleteConfirmId(null);
      await refreshProfiles();

      // If the deleted profile was the active one, notify parent
      if (id === activeProfileId) {
        onSwitch(null);
      }
    } catch (err) {
      setError('Could not delete profile. Please try again.');
    }

    setIsDeleting(false);
  };

  const handleSwitch = async (profile) => {
    if (profile.id === activeProfileId) return;

    setError('');
    try {
      const result = await switchProfile(profile.id);

      if (!result.success) {
        setError(result.error || 'Could not switch profile. Please try again.');
        return;
      }

      onSwitch(profile);
    } catch (err) {
      setError('Could not switch profile. Please try again.');
    }
  };

  const limitReached = isProfileLimitReached(profiles);

  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-y-auto relative" style={{ height: '100dvh' }}>
      {/* Background stars */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
            opacity: Math.random() * 0.7 + 0.3, animationDelay: `${Math.random() * 3}s`
          }} />
      ))}

      <div className="z-10 w-full max-w-lg px-4 py-6 my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 mb-3 bg-purple-500/20 border border-purple-400 rounded-full text-purple-300 text-[10px] font-bold tracking-widest">
            PROFILE MANAGEMENT
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
            Switch Profile
          </h2>
          <p className="text-slate-400 text-sm">
            Manage student profiles — each has separate progress and data.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-400/50 rounded-xl" role="alert">
            <p className="text-red-300 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center text-slate-400 py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading profiles...
          </div>
        ) : (
          <>
            {/* Profile list */}
            <div className="space-y-2 mb-5">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                    profile.id === activeProfileId
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : 'border-slate-600/50 bg-slate-800/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm truncate">{profile.name}</span>
                      {profile.id === activeProfileId && (
                        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-400/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-xs uppercase">{profile.curriculum}</span>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    {profile.id !== activeProfileId && (
                      <button
                        onClick={() => handleSwitch(profile)}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 border border-cyan-400/50 text-cyan-200 font-bold text-xs px-3 py-1.5 rounded-lg transition-all touch-manipulation"
                      >
                        Switch
                      </button>
                    )}

                    {deleteConfirmId === profile.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(profile.id)}
                          disabled={isDeleting}
                          className="bg-red-500/30 hover:bg-red-500/40 active:scale-95 border border-red-400/50 text-red-200 font-bold text-xs px-2 py-1.5 rounded-lg transition-all touch-manipulation disabled:opacity-50"
                        >
                          {isDeleting ? '...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="bg-slate-600/30 hover:bg-slate-600/50 active:scale-95 border border-slate-500/50 text-slate-300 font-bold text-xs px-2 py-1.5 rounded-lg transition-all touch-manipulation"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(profile.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors touch-manipulation p-1"
                        aria-label={`Delete ${profile.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {profiles.length === 0 && (
                <div className="text-center text-slate-500 py-4 text-sm">
                  No profiles yet. Create one below.
                </div>
              )}
            </div>

            {/* Profile limit message */}
            {limitReached && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-400/50 rounded-xl text-center">
                <p className="text-amber-300 text-sm font-medium">Maximum of 10 profiles reached</p>
              </div>
            )}

            {/* Create new profile */}
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={limitReached}
                className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-purple-400/40 text-purple-200 font-bold text-sm px-5 py-3 rounded-xl transition-all touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Create New Profile
              </button>
            ) : (
              <div className="bg-slate-800/70 border-2 border-purple-400/30 rounded-xl p-4">
                <h3 className="text-white font-bold text-sm mb-3">New Profile</h3>

                <form onSubmit={handleCreate} noValidate>
                  {/* Name input */}
                  <div className="mb-3">
                    <label htmlFor="profile-name" className="block text-xs font-bold text-cyan-300 mb-1">
                      Name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={newName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter name"
                      maxLength={30}
                      autoComplete="given-name"
                      className={`w-full px-3 py-2.5 bg-slate-700/50 border-2 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all ${
                        nameError || namespaceWarning ? 'border-red-400/70' : 'border-slate-600/50 focus:border-cyan-400/70'
                      }`}
                    />
                    {nameError && (
                      <p className="mt-1 text-red-400 text-xs font-medium" role="alert">
                        {nameError}
                      </p>
                    )}
                    {!nameError && namespaceWarning && (
                      <p className="mt-1 text-red-400 text-xs font-medium" role="alert">
                        {namespaceWarning}
                      </p>
                    )}
                  </div>

                  {/* Curriculum selector */}
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-cyan-300 mb-1">
                      Curriculum
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CURRICULUM_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setNewCurriculum(option.value);
                            if (curriculumError) setCurriculumError('');
                          }}
                          className={`text-center px-2 py-2 rounded-lg border-2 transition-all touch-manipulation text-xs font-bold ${
                            newCurriculum === option.value
                              ? 'border-cyan-400 bg-cyan-400/10 text-white'
                              : 'border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {curriculumError && (
                      <p className="mt-1 text-red-400 text-xs font-medium" role="alert">
                        {curriculumError}
                      </p>
                    )}
                  </div>

                  {/* Create error */}
                  {createError && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-400/50 rounded-lg" role="alert">
                      <p className="text-red-300 text-xs font-medium">{createError}</p>
                    </div>
                  )}

                  {/* Form buttons */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-2.5 rounded-xl transition-all touch-manipulation"
                    >
                      {isCreating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewName('');
                        setNewCurriculum('');
                        setNameError('');
                        setCurriculumError('');
                        setCreateError('');
                        setNamespaceWarning('');
                      }}
                      className="bg-slate-600/50 hover:bg-slate-600/70 active:scale-95 text-slate-300 font-bold text-sm px-4 py-2.5 rounded-xl transition-all touch-manipulation"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-slate-500/40 text-slate-300 font-bold text-sm px-5 py-3 rounded-xl transition-all touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </button>
        )}
      </div>

      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
