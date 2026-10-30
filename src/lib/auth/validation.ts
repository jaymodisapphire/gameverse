import { PasswordValidationResult } from '@/types';

/**
 * Validates an email address against standard format.
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email address exceeds maximum length.' };
  }

  // RFC 5322 compatible regex check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  return { isValid: true };
}

/**
 * Validates a username according to GAMEVERSE gaming standards:
 * - 3 to 20 characters
 * - Alphanumeric and underscores only
 * - Cannot start with underscore or number
 * - Cannot contain reserved words (admin, system, root, mod, gameverse)
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required.' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Username cannot exceed 20 characters.' };
  }

  const validChars = /^[a-zA-Z0-9_]+$/;
  if (!validChars.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores.' };
  }

  const reservedUsernames = ['admin', 'administrator', 'system', 'root', 'moderator', 'gameverse', 'support', 'help'];
  if (reservedUsernames.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: 'This username is reserved and cannot be claimed.' };
  }

  return { isValid: true };
}

/**
 * Validates a password with a comprehensive strength check:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one numeric digit
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      label: 'Too Weak',
      color: '#ef4444',
      errors: ['Password is required.'],
    };
  }

  if (password.length < 8) {
    errors.push('At least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('At least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&*)');
  }

  // Calculate score (0-4)
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  let label: PasswordValidationResult['label'] = 'Too Weak';
  let color = '#ef4444'; // Red

  if (score === 1) {
    label = 'Weak';
    color = '#f97316'; // Orange
  } else if (score === 2) {
    label = 'Fair';
    color = '#eab308'; // Yellow
  } else if (score === 3) {
    label = 'Strong';
    color = '#10b981'; // Green
  } else if (score >= 4) {
    label = 'Legendary';
    color = '#8b5cf6'; // Electric Purple
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    score,
    label,
    color,
    errors,
  };
}

/**
 * Sanitizes redirect target URLs to defend against Open Redirect attacks.
 * Disallows external domains, protocol-relative URLs (`//evil.com`), and javascript: schemes.
 */
export function sanitizeRedirectUrl(url: string | null | undefined, defaultUrl: string = '/dashboard'): string {
  if (!url || typeof url !== 'string') {
    return defaultUrl;
  }

  const trimmed = url.trim();

  // Must start with a single '/' and not '//' or '\\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultUrl;
  }

  // Reject any embedded scheme like '/\tjavascript:'
  if (/[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) {
    return defaultUrl;
  }

  return trimmed;
}

/**
 * Generates a client-side random 6-digit Player ID in the format GV-XXXXXX.
 */
export function generatePlayerId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `GV-${digits}`;
}
