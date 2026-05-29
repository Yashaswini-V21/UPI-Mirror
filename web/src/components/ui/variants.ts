import { Variants } from 'framer-motion';

export const criticalPulse: Variants = {
  animate: {
    scale: [1, 0.98, 1],
    borderColor: [
      'rgba(255, 92, 122, 0.2)',
      'rgba(255, 92, 122, 0.6)',
      'rgba(255, 92, 122, 0.2)',
    ],
    boxShadow: [
      '0 0 0 rgba(255, 92, 122, 0)',
      '0 0 12px rgba(255, 92, 122, 0.3)',
      '0 0 0 rgba(255, 92, 122, 0)',
    ],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
