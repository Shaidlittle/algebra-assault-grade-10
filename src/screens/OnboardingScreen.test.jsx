import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { OnboardingScreen, validateName, validateCurriculum } from './OnboardingScreen.jsx';

// Mock window.storage for profileManager
beforeEach(() => {
  window.storage = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue({ key: 'test', value: 'test' }),
    delete: vi.fn().mockResolvedValue({ key: 'test', deleted: true }),
    list: vi.fn().mockResolvedValue({ keys: [] }),
  };
});

describe('validateName', () => {
  it('returns valid for a simple name', () => {
    expect(validateName('Sarah')).toEqual({ valid: true });
  });

  it('returns valid for name with hyphen', () => {
    expect(validateName('Mary-Jane')).toEqual({ valid: true });
  });

  it('returns valid for name with apostrophe', () => {
    expect(validateName("O'Brien")).toEqual({ valid: true });
  });

  it('returns valid for name with spaces', () => {
    expect(validateName('James Jr')).toEqual({ valid: true });
  });

  it('trims whitespace before validation', () => {
    expect(validateName('  Anna  ')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects whitespace-only string', () => {
    const result = validateName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects name longer than 20 chars after trim', () => {
    const result = validateName('Abcdefghijklmnopqrstu'); // 21 chars
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20');
  });

  it('accepts name exactly 20 chars', () => {
    expect(validateName('Abcdefghijklmnopqrst')).toEqual({ valid: true }); // 20 chars
  });

  it('accepts single character name', () => {
    expect(validateName('A')).toEqual({ valid: true });
  });

  it('rejects name with numbers', () => {
    const result = validateName('Sarah123');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects name with special characters', () => {
    const result = validateName('Sarah@!');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects non-string input', () => {
    const result = validateName(null);
    expect(result.valid).toBe(false);
  });
});

describe('validateCurriculum', () => {
  it('returns valid for caps', () => {
    expect(validateCurriculum('caps')).toEqual({ valid: true });
  });

  it('returns valid for ieb', () => {
    expect(validateCurriculum('ieb')).toEqual({ valid: true });
  });

  it('returns valid for cambridge', () => {
    expect(validateCurriculum('cambridge')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    const result = validateCurriculum('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects null', () => {
    const result = validateCurriculum(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects invalid curriculum', () => {
    const result = validateCurriculum('other');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('OnboardingScreen component', () => {
  it('renders without throwing', () => {
    expect(() => render(<OnboardingScreen onComplete={() => {}} />)).not.toThrow();
  });

  it('displays name input and curriculum options', () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    expect(screen.getByLabelText(/your first name/i)).toBeInTheDocument();
    expect(screen.getByText('CAPS')).toBeInTheDocument();
    expect(screen.getByText('IEB')).toBeInTheDocument();
    expect(screen.getByText('Cambridge')).toBeInTheDocument();
  });

  it('shows name validation error on empty submit', async () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /let's go/i }));
    await waitFor(() => {
      expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
    });
  });

  it('shows curriculum validation error when no curriculum selected', async () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    const nameInput = screen.getByLabelText(/your first name/i);
    fireEvent.change(nameInput, { target: { value: 'Sarah' } });
    fireEvent.click(screen.getByRole('button', { name: /let's go/i }));
    await waitFor(() => {
      expect(screen.getByText(/please select a curriculum/i)).toBeInTheDocument();
    });
  });

  it('calls onComplete after successful profile creation', async () => {
    const onComplete = vi.fn();
    render(<OnboardingScreen onComplete={onComplete} />);

    const nameInput = screen.getByLabelText(/your first name/i);
    fireEvent.change(nameInput, { target: { value: 'Sarah' } });
    fireEvent.click(screen.getByText('CAPS'));
    fireEvent.click(screen.getByRole('button', { name: /let's go/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('displays storage error and preserves form data on failure', async () => {
    window.storage.set = vi.fn().mockResolvedValue(null);

    render(<OnboardingScreen onComplete={() => {}} />);

    const nameInput = screen.getByLabelText(/your first name/i);
    fireEvent.change(nameInput, { target: { value: 'Sarah' } });
    fireEvent.click(screen.getByText('IEB'));
    fireEvent.click(screen.getByRole('button', { name: /let's go/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not save profile/i)).toBeInTheDocument();
    });

    // Form data should be preserved
    expect(nameInput.value).toBe('Sarah');
  });

  it('shows invalid character error for name with numbers', async () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    const nameInput = screen.getByLabelText(/your first name/i);
    fireEvent.change(nameInput, { target: { value: 'Test123' } });
    fireEvent.click(screen.getByText('CAPS'));
    fireEvent.click(screen.getByRole('button', { name: /let's go/i }));
    await waitFor(() => {
      expect(screen.getByText(/name can only contain/i)).toBeInTheDocument();
    });
  });
});
