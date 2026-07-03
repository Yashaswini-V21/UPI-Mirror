/**
 * landing/index.ts
 * ─────────────────
 * Barrel export for all landing sub-components.
 * Import from 'components/landing' instead of deep paths.
 */

export { BackgroundEffects } from './BackgroundEffects';
export { NavBar } from './NavBar';
export { Starfield } from './Starfield';
export { C } from './DesignTokens';
export { useCountUp } from './hooks';

// Primitives
export { DecryptedText } from './primitives/DecryptedText';
export { MagneticButton } from './primitives/MagneticButton';
export { SpotlightCard } from './primitives/SpotlightCard';
export { WordReveal } from './primitives/WordReveal';
