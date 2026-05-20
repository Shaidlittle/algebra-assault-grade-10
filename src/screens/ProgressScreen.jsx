import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Trophy, Target, AlertCircle, FileText, Copy, X } from 'lucide-react';
import { QUESTIONS } from '../data/questions.js';
import { generateReport } from '../utils/reportGenerator.js';

/**
 * ProgressScreen — displays aggregated student learning statistics and trends.
 * Props:
 *   metrics — output of computeMetrics() or null if data unavailable
 *   sessionsCount — number of recorded sessions
 *   setScreen — navigation callback
 *   streakData — daily challenge streak data
 *   masteryData — computed mastery levels per topic
 */
export function ProgressScreen({ metrics, sessionsCount, setScreen, streakData, masteryData, activeProfileName }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerateReport = () => {
    const report = generateReport(metrics, {
      studentName: activeProfileName || 'Student',
      streakData: streakData || null,
      masteryLevels: masteryData || {},
    });
    setReportText(report);
    setShowReportModal(true);
    setCopySuccess(false);
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      // Fallback message shown via UI
    }
  };

  // Data unavailable (storage failure)
  if (metrics === null) {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Progress data unavailable</h2>
          <p className="text-slate-400 text-sm mb-6">We couldn't load your progress data. Please try again later.</p>
          <button
            onClick={() => setScreen('menu')}
            className="flex items-center gap-2 mx-auto text-cyan-300 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // No sessions recorded yet
  if (sessionsCount === 0) {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center max-w-sm">
          <Target className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No sessions recorded yet</h2>
          <p className="text-slate-400 text-sm mb-6">Complete a mission to start tracking!</p>
          <button
            onClick={() => setScreen('menu')}
            className="flex items-center gap-2 mx-auto text-cyan-300 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Determine trend display
  const renderTrend = () => {
    if (sessionsCount < 2) {
      return (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span>📊</span>
          <span>Play more sessions to see trends</span>
        </div>
      );
    }
    if (!metrics.trend) {
      return (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span>📊</span>
          <span>Need more sessions</span>
        </div>
      );
    }
    const diff = metrics.trend.newer - metrics.trend.older;
    if (diff > 0) {
      return (
        <div className="flex items-center gap-2 text-green-400 font-semibold">
          <TrendingUp className="w-5 h-5" />
          <span>Improving! +{diff.toFixed(1)}%</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <TrendingDown className="w-5 h-5" />
          <span>Declining {diff.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-slate-300 font-semibold">
        <span>➡️</span>
        <span>Steady</span>
      </div>
    );
  };

  // Get topic display name
  const getTopicName = (topicKey) => {
    if (QUESTIONS[topicKey]) return QUESTIONS[topicKey].name;
    // Fallback: capitalize the key
    return topicKey.charAt(0).toUpperCase() + topicKey.slice(1);
  };

  const topicEntries = Object.entries(metrics.perTopicAccuracy || {});

  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-y-auto" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
        <button
          onClick={() => setScreen('menu')}
          className="text-cyan-300 hover:text-white transition-colors"
          aria-label="Back to menu"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Your Progress</h1>
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Overall Accuracy */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Overall Accuracy</div>
          <div className="text-4xl font-black text-white">
            {metrics.overallAccuracy.toFixed(1)}%
          </div>
          <div className="text-slate-400 text-sm mt-1">
            {metrics.totalQuestions} questions solved
          </div>
        </div>

        {/* Improvement Trend */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Improvement Trend</div>
          {renderTrend()}
          {sessionsCount < 2 && (
            <p className="text-slate-500 text-xs mt-2">Play more sessions to see trends</p>
          )}
        </div>

        {/* Strongest & Weakest Topics */}
        {(metrics.strongestTopic || metrics.weakestTopic) && (
          <div className="grid grid-cols-2 gap-3">
            {metrics.strongestTopic && (
              <div className="bg-slate-800/60 border border-green-500/30 rounded-xl p-3">
                <div className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Trophy className="w-3 h-3 inline mr-1" />
                  Strongest
                </div>
                <div className="text-green-300 font-bold text-sm truncate">
                  {getTopicName(metrics.strongestTopic)}
                </div>
                <div className="text-green-400/70 text-xs">
                  {(metrics.perTopicAccuracy[metrics.strongestTopic] || 0).toFixed(0)}%
                </div>
              </div>
            )}
            {metrics.weakestTopic && (
              <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-3">
                <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Target className="w-3 h-3 inline mr-1" />
                  Weakest
                </div>
                <div className="text-amber-300 font-bold text-sm truncate">
                  {getTopicName(metrics.weakestTopic)}
                </div>
                <div className="text-amber-400/70 text-xs">
                  {(metrics.perTopicAccuracy[metrics.weakestTopic] || 0).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Per-Topic Accuracy Breakdown */}
        {topicEntries.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Per-Topic Accuracy</div>
            <div className="space-y-3">
              {topicEntries.map(([topicKey, accuracy]) => {
                const topicColor = QUESTIONS[topicKey]?.color || '#94a3b8';
                return (
                  <div key={topicKey}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 text-sm font-medium">{getTopicName(topicKey)}</span>
                      <span className="text-slate-400 text-xs font-semibold">{accuracy.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(accuracy, 100)}%`, backgroundColor: topicColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate Report Button */}
        <button onClick={handleGenerateReport}
          className="w-full bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-purple-400/40 text-purple-200 font-bold text-sm py-3 rounded-xl transition-all touch-manipulation flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-white font-bold">Learning Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">{reportText}</pre>
            </div>
            <div className="p-4 border-t border-slate-700 flex gap-2">
              <button onClick={handleCopyReport}
                className={`flex-1 font-bold text-sm py-2.5 rounded-xl transition-all touch-manipulation flex items-center justify-center gap-2 ${copySuccess ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
                <Copy className="w-4 h-4" /> {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button onClick={() => setShowReportModal(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all touch-manipulation">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
