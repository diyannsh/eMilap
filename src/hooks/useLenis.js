import { useEffect } from 'react';
import Lenis from 'lenis';

export default function useLenis(wrapperRef) {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = wrapper?.querySelector('[data-lenis-content]');
    if (!wrapper || !content) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const lenis = new Lenis({ wrapper, content, smoothWheel: true, lerp: 0.1 });
    let frameId;
    const animate = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, [wrapperRef]);
}
