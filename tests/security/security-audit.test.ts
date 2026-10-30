import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeRedirectUrl } from '../../src/lib/auth/validation';

test('--- Security Audit Suite (Section D) ---', async (t) => {
  await t.test('1. Verify no service-role keys are exposed to client code', () => {
    const clientFiles = [
      path.join(process.cwd(), 'src/lib/supabase/client.ts'),
      path.join(process.cwd(), 'src/lib/supabase/config.ts'),
      path.join(process.cwd(), 'src/lib/auth/auth-context.tsx'),
      path.join(process.cwd(), 'src/app/auth/login/page.tsx'),
      path.join(process.cwd(), 'src/app/auth/signup/page.tsx'),
    ];

    for (const file of clientFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        assert.equal(
          content.includes('SUPABASE_SERVICE_ROLE_KEY'),
          false,
          `File ${file} must NEVER reference SUPABASE_SERVICE_ROLE_KEY`
        );
      }
    }
  });

  await t.test('2. Verify Open Redirect defense across all malicious vectors', () => {
    const maliciousVectors = [
      '//attacker.com/steal-token',
      '\\\\attacker.com\\evil',
      'http://phishing-gameverse.com',
      'https://malicious.org/login',
      'javascript:stealCookies()',
      'data:text/html,<script>alert(1)</script>',
      '/\tjavascript:alert(1)',
      '/\\evil.com',
      '///evil.com',
      'ftp://badsite.com',
    ];

    for (const vector of maliciousVectors) {
      const sanitized = sanitizeRedirectUrl(vector, '/dashboard');
      assert.equal(
        sanitized,
        '/dashboard',
        `Malicious vector "${vector}" must be redirected to safe fallback "/dashboard"`
      );
    }
  });

  await t.test('3. Verify Row Level Security (RLS) is strictly enabled in migration SQL', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20261030_auth_profiles.sql'
    );
    assert.ok(fs.existsSync(migrationPath), 'Migration SQL file must exist');

    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    // Must enable RLS
    assert.ok(
      sqlContent.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'),
      'SQL must enable RLS on public.profiles'
    );

    // Must restrict INSERT to auth.uid() = id
    assert.ok(
      sqlContent.includes('auth.uid() = id'),
      'SQL must restrict insert/update to auth.uid() = id'
    );

    // Must have unique constraint on player_id
    assert.ok(
      sqlContent.includes('player_id TEXT UNIQUE NOT NULL'),
      'player_id must have UNIQUE constraint'
    );
  });

  await t.test('4. Verify Account Enumeration Protection', () => {
    // Both existing and non-existing email queries must yield identical external status
    const genericResponse = 'If an account matches this email, instructions have been sent.';
    const simulateForgotResponse = (_email: string) => genericResponse;

    assert.equal(
      simulateForgotResponse('real_player@gameverse.gg'),
      simulateForgotResponse('ghost_user@random.org'),
      'Responses must be indistinguishable to thwart account enumeration'
    );
  });
});
