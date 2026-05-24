import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImprovementToast } from './ImprovementToast.jsx';

describe('ImprovementToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message text', () => {
    const html = renderToStaticMarkup(
      <ImprovementToast message="Your linear accuracy improved by 15%!" onDismiss={() => {}} />
    );
    expect(html).toContain('Your linear accuracy improved by 15%!');
  });

  it('renders nothing when message is empty', () => {
    const html = renderToStaticMarkup(
      <ImprovementToast message="" onDismiss={() => {}} />
    );
    expect(html).toBe('');
  });

  it('renders nothing when message is null/undefined', () => {
    const html = renderToStaticMarkup(
      <ImprovementToast message={null} onDismiss={() => {}} />
    );
    expect(html).toBe('');
  });

  it('has fixed positioning classes for non-blocking overlay', () => {
    const html = renderToStaticMarkup(
      <ImprovementToast message="Great job!" onDismiss={() => {}} />
    );
    expect(html).toContain('fixed');
    expect(html).toContain('top-4');
    expect(html).toContain('z-40');
    expect(html).toContain('pointer-events-none');
  });

  it('has celebratory gold/yellow styling', () => {
    const html = renderToStaticMarkup(
      <ImprovementToast message="New streak record!" onDismiss={() => {}} />
    );
    // Should have yellow/amber gradient styling
    expect(html).toContain('yellow');
  });

  it('includes a star icon for celebration', () => {
    const html = renderToStaticMarkup(
      <ImprovementToast message="Improvement!" onDismiss={() => {}} />
    );
    expect(html).toContain('⭐');
  });

  it('has role="status" and aria-live for accessibility', () => {
    const html = renderToStaticMarkup(
      <ImprovementToast message="Well done!" onDismiss={() => {}} />
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});
