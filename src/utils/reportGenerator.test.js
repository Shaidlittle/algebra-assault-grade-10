import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateReport } from './reportGenerator.js';

/**
 * **Validates: Requirements 39.2**
 */

describe('Report Generator', () => {
  describe('39.2: Report generator content completeness', () => {
    it('report always contains header, overview, and end marker', () => {
      fc.assert(
        fc.property(
          fc.record({
            overallAccuracy: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
            totalQuestions: fc.integer({ min: 0, max: 1000 }),
            perTopicAccuracy: fc.constant({}),
            strongestTopic: fc.constantFrom(null, 'linear', 'quadratic'),
            weakestTopic: fc.constantFrom(null, 'linear', 'quadratic'),
            trend: fc.constantFrom(null, { older: 50, newer: 60 }),
          }),
          (metrics) => {
            const report = generateReport(metrics);

            expect(report).toContain('=== ALGEBRA ASSAULT - LEARNING REPORT ===');
            expect(report).toContain('--- OVERVIEW ---');
            expect(report).toContain('--- END OF REPORT ---');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('report includes student name from options', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          (studentName) => {
            const metrics = {
              overallAccuracy: 75,
              totalQuestions: 50,
              perTopicAccuracy: {},
              strongestTopic: null,
              weakestTopic: null,
              trend: null,
            };
            const report = generateReport(metrics, { studentName });

            expect(report).toContain(`Student: ${studentName}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('report includes overall accuracy when metrics are provided', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          (accuracy) => {
            const metrics = {
              overallAccuracy: accuracy,
              totalQuestions: 50,
              perTopicAccuracy: {},
              strongestTopic: null,
              weakestTopic: null,
              trend: null,
            };
            const report = generateReport(metrics);

            expect(report).toContain(`Overall Accuracy: ${accuracy.toFixed(1)}%`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('report includes topic accuracy data when available', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('linear', 'quadratic', 'exponential'),
          fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          (topic, accuracy) => {
            const metrics = {
              overallAccuracy: accuracy,
              totalQuestions: 50,
              perTopicAccuracy: { [topic]: accuracy },
              strongestTopic: topic,
              weakestTopic: topic,
              trend: null,
            };
            const report = generateReport(metrics);

            expect(report).toContain(`${topic}: ${accuracy.toFixed(1)}%`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('report includes streak data when provided', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (currentStreak) => {
            const metrics = {
              overallAccuracy: 75,
              totalQuestions: 50,
              perTopicAccuracy: {},
              strongestTopic: null,
              weakestTopic: null,
              trend: null,
            };
            const report = generateReport(metrics, {
              streakData: { currentStreak },
            });

            expect(report).toContain(`Daily Challenge Streak: ${currentStreak}`);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('report handles null metrics gracefully', () => {
      const report = generateReport(null);
      expect(report).toContain('No progress data available.');
      expect(report).toContain('--- END OF REPORT ---');
    });

    it('report includes date range when provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.trim().length > 0),
          (dateRange) => {
            const metrics = {
              overallAccuracy: 75,
              totalQuestions: 50,
              perTopicAccuracy: {},
              strongestTopic: null,
              weakestTopic: null,
              trend: null,
            };
            const report = generateReport(metrics, { dateRange });

            expect(report).toContain(`Period: ${dateRange}`);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
