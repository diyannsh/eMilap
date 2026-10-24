import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---- Tuning knobs -------------------------------------------------------
const START_SCALE = 0.28;        // size at the very top (1 = current full size)
const FULL_AT = 0.8;             // fraction of the page scroll where it reaches full size (then stays)
const ORIGIN = '50% 50%';        // point the flower grows from; try '50% 70%' to grow upward from its base
const START_ROTATE = -12;        // slight tilt that straightens as it grows
const START_LOOK = 'brightness(0.62) saturate(0.8)'; // darker, more "closed" look that opens up
// -------------------------------------------------------------------------

/**
 * Grows the flower as the page scrolls.
 * Pass a ref to the flower <img> (or a wrapper div around it).
 * If the flower is positioned with its own CSS transform, put the ref on an inner wrapper
 * so this hook doesn't fight the positioning.
 */
export default function useFlowerGrowth(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { scale: 1, rotate: 0, filter: 'none' });
      return undefined;
    }

    const ctx = gsap.context(() => {
      // One paused timeline that represents "bud -> full bloom"; scroll sets its progress.
      const grow = gsap.timeline({ paused: true }).fromTo(
        el,
        { scale: START_SCALE, rotate: START_ROTATE, filter: START_LOOK, transformOrigin: ORIGIN },
        { scale: 1, rotate: 0, filter: 'brightness(1) saturate(1)', ease: 'power1.out', duration: 1 },
      );

      const update = () => {
        const max = ScrollTrigger.maxScroll(window) || 1;
        const p = Math.min(1, Math.max(0, window.scrollY / (max * FULL_AT)));
        gsap.to(grow, { progress: p, duration: 0.7, ease: 'power3.out', overwrite: true });
      };

      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      ScrollTrigger.addEventListener('refresh', update);
      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        ScrollTrigger.removeEventListener('refresh', update);
      };
    });

    return () => ctx.revert();
  }, [ref]);
}
