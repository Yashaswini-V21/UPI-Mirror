/**
 * landing/DesignTokens.ts
 * ────────────────────────
 * Centralised design tokens for the landing page.
 * Import as `import { C } from './DesignTokens'` — never duplicate inline.
 */

export const C = {
  indigo:      '#6366f1',
  pink:        '#ec4899',
  teal:        '#14b8a6',
  bg:          '#03030c',
  surface:     'rgba(255,255,255,0.03)',
  border:      'rgba(255,255,255,0.07)',
  borderGlow:  'rgba(99,102,241,0.25)',
  textPrimary: '#f0f4ff',
  textMuted:   'rgba(200,210,255,0.55)',
  textFaint:   'rgba(200,210,255,0.28)',
  grad:        'linear-gradient(135deg,#6366f1,#ec4899,#14b8a6)',
  gradH:       'linear-gradient(90deg,#6366f1,#ec4899)',
  gradV:       'linear-gradient(180deg,#6366f1,#14b8a6)',
} as const;

export type DesignTokens = typeof C;
