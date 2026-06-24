// src/Ui/Reports/useBreakpoint.js
// Lightweight hook — no external deps, SSR-safe.
import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const getBreakpoint = () => {
    if (typeof window === 'undefined') return 'lg';
    const w = window.innerWidth;
    if (w < 480)  return 'xs';   // small phone
    if (w < 640)  return 'sm';   // phone
    if (w < 768)  return 'md';   // large phone / small tablet
    if (w < 1024) return 'lg';   // tablet / small laptop
    return 'xl';                 // desktop
  };

  const [bp, setBp] = useState(getBreakpoint);

  useEffect(() => {
    const handler = () => setBp(getBreakpoint());
    const mql = window.matchMedia('(max-width: 1024px)');
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    bp,
    isMobile:  ['xs', 'sm'].includes(bp),
    isTablet:  bp === 'md',
    isDesktop: ['lg', 'xl'].includes(bp),
    isSmall:   ['xs', 'sm', 'md'].includes(bp),
  };
}