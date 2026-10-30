import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeRedirectUrl,
  generatePlayerId,
} from '../../src/lib/auth/validation';

test('--- Unit Test Suite: Validation & Sanitization ---', async (t) => {
  await t.test('1. validateEmail() - valid emails', () => {
    const validEmails = [
      'gamer@gameverse.gg',
      'test.player+sub@domain.co.uk',
      'user_123@sub.example.com',
      'player@gmail.com',
    ];

    for (const email of validEmails) {
      const res = validateEmail(email);
      assert.equal(res.isValid, true, `Expected ${email} to be valid`);
      assert.equal(res.error, undefined);
    }
  });

  await t.test('1. validateEmail() - invalid emails', () => {
    const invalidEmails = [
      '',
      'notanemail',
      'missing@domain',
      '@missinglocal.com',
      'spaces in@email.com',
      'double@@sign.com',
    ];

    for (const email of invalidEmails) {
      const res = validateEmail(email);
      assert.equal(res.isValid, false, `Expected ${email} to be invalid`);
      assert.ok(res.error && res.error.length > 0);
    }
  });

  await t.test('2. validateUsername() - valid usernames', () => {
    const validUsernames = [
      'CyberKnight',
      'gamer_99',
      'PlayerOne',
      'abc',
      'super_ultra_long_20',
    ];

    for (const u of validUsernames) {
      const res = validateUsername(u);
      assert.equal(res.isValid, true, `Expected ${u} to be valid`);
    }
  });

  await t.test('2. validateUsername() - invalid usernames & reserved keywords', () => {
    const invalidUsernames = [
      '',
      'ab', // < 3 chars
      'this_username_is_way_too_long_for_gameverse_standards', // > 20 chars
      'invalid@user!', // special characters
      'user space',
      'admin', // reserved
      'system', // reserved
      'gameverse', // reserved
    ];

    for (const u of invalidUsernames) {
      const res = validateUsername(u);
      assert.equal(res.isValid, false, `Expected ${u} to be invalid`);
      assert.ok(res.error && res.error.length > 0);
    }
  });

  await t.test('3. validatePassword() - strength scoring and criteria', () => {
    // Too weak
    const weak1 = validatePassword('12345');
    assert.equal(weak1.isValid, false);
    assert.equal(weak1.score, 0);

    // Missing uppercase and special
    const weak2 = validatePassword('gameverse123');
    assert.equal(weak2.isValid, false);
    assert.ok(weak2.errors.some((e) => e.includes('uppercase')));

    // Missing numbers and special
    const weak3 = validatePassword('GameVerseIsCool');
    assert.equal(weak3.isValid, false);
    assert.ok(weak3.errors.some((e) => e.includes('number')));

    // Valid strong password
    const strong = validatePassword('GameVerse@2026!');
    assert.equal(strong.isValid, true);
    assert.equal(strong.errors.length, 0);
    assert.ok(strong.score >= 3);
    assert.ok(['Strong', 'Legendary'].includes(strong.label));
  });

  await t.test('4. sanitizeRedirectUrl() - Open Redirect defense', () => {
    // Malicious vectors
    assert.equal(sanitizeRedirectUrl('http://evil.com'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('https://phishing.site'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('//evil.com/fake-login'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('/\\evil.com'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('javascript:alert(1)'), '/dashboard');
    assert.equal(sanitizeRedirectUrl(null), '/dashboard');
    assert.equal(sanitizeRedirectUrl(''), '/dashboard');

    // Valid internal routes
    assert.equal(sanitizeRedirectUrl('/dashboard'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('/games/ludo'), '/games/ludo');
    assert.equal(sanitizeRedirectUrl('/profile?tab=stats'), '/profile?tab=stats');
  });

  await t.test('5. generatePlayerId() - format and uniqueness', () => {
    const ids = new Set<string>();
    const pidRegex = /^GV-[0-9]{6}$/;

    for (let i = 0; i < 200; i++) {
      const pid = generatePlayerId();
      assert.ok(pidRegex.test(pid), `Player ID ${pid} must match ^GV-[0-9]{6}$`);
      ids.add(pid);
    }

    // Uniqueness: 200 random 6-digit samples should have virtually 0 collisions
    assert.ok(ids.size >= 195, `Expected high uniqueness, got ${ids.size} unique IDs`);
  });
});
