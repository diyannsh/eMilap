import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './SpatialTransition.css';

// ---- Tuning knobs -------------------------------------------------------
const OPEN_DURATION = 0.55;   // card zoom, in seconds (was 0.72)
const EASE = 'power3.inOut';  // symmetric, so open and close both feel snappy (was expo.inOut)
const ARRIVE_AT = 0.35;       // mount the section page at this fraction of the zoom
const REVEAL_AT = 0.55;       // start fading the page in at this fraction of the zoom
const CLOSE_SPEED = 1.4;      // closing plays faster than opening
// -------------------------------------------------------------------------

export default function SpatialTransition({ card, pageReady, direction, onCardArrive, onOpenComplete, onCloseComplete }) {
  const backdropRef = useRef(null);
  const timelineRef = useRef(null);
  const pageTweenAdded = useRef(false);
  const revealAtRef = useRef(0);
  const pageReadyRef = useRef(pageReady);
  const callbacks = useRef({ onCardArrive, onOpenComplete, onCloseComplete });
  callbacks.current = { onCardArrive, onOpenComplete, onCloseComplete };
  pageReadyRef.current = pageReady;

  useEffect(() => {
    if (!card) return undefined;
    const origin = card.getBoundingClientRect();
    const nav = document.querySelector('.section-nav-back');
    const grid = document.querySelector('.grid-scan');
    const navOpacity = nav?.style.opacity ?? '';
    // The orbit renderer writes its own inline transform. Keep the entire declaration
    // block so the shared node returns exactly to that orbit-managed state.
    const originalCardStyle = card.style.cssText;
    const originalGridStyle = grid?.style.cssText ?? '';
    const inner = card.querySelector('.orbit-item-inner');
    const innerTransition = inner?.style.transition ?? '';
    if (inner) inner.style.transition = 'none';
    const parent = card.parentElement;
    const siblingCards = [...(parent?.querySelectorAll('.orbit-item') ?? [])].filter((item) => item !== card);
    const siblings = siblingCards.map((item) => item.querySelector('.orbit-item-inner')).filter(Boolean);
    const siblingTransitions = siblings.map((item) => item.style.transition);
    siblings.forEach((item) => { item.style.transition = 'none'; });
    const orbitDetails = [
      ...(parent?.querySelectorAll('.orbit-path-svg, .orbit-center-content') ?? []),
      ...(parent?.parentElement?.querySelectorAll('.section-orbit-eyebrow, .section-orbit-hint') ?? []),
    ];

    // Uniform scale: the tile keeps its proportions instead of being stretched
    // (the old scaleX/scaleY pair stretched a square tile ~6x wide and ~4.5x tall).
    const maxWidth = window.innerWidth * 0.36;
    const maxHeight = window.innerHeight * 0.58;
    const scale = Math.min(maxWidth / origin.width, maxHeight / origin.height);
    const target = {
      x: (window.innerWidth - origin.width * scale) / 2,
      y: 80 + (window.innerHeight - 80 - origin.height * scale) / 2,
      scale,
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set(card, {
      position: 'fixed', left: 0, top: 0, x: origin.left, y: origin.top,
      scale: 1, transformOrigin: 'top left', zIndex: 1001,
      opacity: 1,
    });
    gsap.set(backdropRef.current, { opacity: 0 });
    if (nav) gsap.set(nav, { opacity: 0 });
    if (grid) gsap.set(grid, { transformOrigin: 'center center' });

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: EASE },
      onComplete: () => {
        if (pageReadyRef.current) {
          callbacks.current.onOpenComplete?.();
        } else {
          callbacks.current.onCardArrive?.();
        }
      },
      onReverseComplete: () => {
        // The section may have been scrolled while open; restore the orbit's original viewport slot invisibly.
        window.scrollTo(0, 0);
        gsap.set(card, { clearProps: 'all' });
        card.style.cssText = originalCardStyle;
        gsap.core.getCache(card).uncache = 1;
        if (grid) {
          grid.style.cssText = originalGridStyle;
          gsap.core.getCache(grid).uncache = 1;
        }
        if (nav) nav.style.opacity = navOpacity;
        if (inner) inner.style.transition = innerTransition;
        siblings.forEach((item, index) => { item.style.transition = siblingTransitions[index]; });
        callbacks.current.onCloseComplete?.();
      },
    });

    const duration = reduced ? 0.2 : OPEN_DURATION;
    revealAtRef.current = reduced ? 0.1 : duration * REVEAL_AT;

    if (reduced) {
      if (nav) tl.to(nav, { opacity: 1, duration: 0.2, ease: 'none' }, 0);
      tl.to(orbitDetails, { opacity: 0, duration: 0.2, ease: 'none' }, 0);
      tl.call(() => { if (!pageReadyRef.current) callbacks.current.onCardArrive?.(); }, null, 0.05);
    } else {
      if (nav) tl.to(nav, { opacity: 1, duration: 0.25, ease: 'power3.out' }, 0);
      // No blur here: animating filter: blur() on a full-screen element is what dropped frames.
      if (grid) tl.to(grid, { scale: 1.05, duration, ease: 'power2.out' }, 0);
      tl.to(card, { x: target.x, y: target.y, scale: target.scale, duration }, 0);
      const clickedIndex = Number(card.dataset.orbitItem ?? 0);
      tl.to(siblings, {
        opacity: 0, scale: 0.9, duration: 0.22,
        stagger: (index, element) => {
          const itemIndex = Number(element.parentElement?.dataset.orbitItem ?? index);
          const distance = Math.abs(itemIndex - clickedIndex);
          const total = siblingCards.length + 1;
          const circularDistance = Math.min(distance, total - distance);
          const maxDistance = Math.max(1, Math.floor(total / 2));
          return (circularDistance / maxDistance) * 0.12;
        },
        ease: 'power3.out',
      }, 0);
      tl.to(orbitDetails, { opacity: 0, duration: 0.28, ease: 'power3.out' }, 0);
      tl.to(backdropRef.current, { opacity: 0.24, duration }, 0);
      // Mount the section while the card is still travelling, so the page is ready to fade in
      // as soon as the card is close to its destination (no empty gap in between).
      tl.call(() => { if (!pageReadyRef.current) callbacks.current.onCardArrive?.(); }, null, duration * ARRIVE_AT);
    }
    timelineRef.current = tl;
    tl.play(0);

    return () => {
      tl.kill();
      timelineRef.current = null;
      gsap.set(card, { clearProps: 'all' });
      card.style.cssText = originalCardStyle;
      gsap.core.getCache(card).uncache = 1;
      if (nav) nav.style.opacity = navOpacity;
      if (grid) {
        grid.style.cssText = originalGridStyle;
        gsap.core.getCache(grid).uncache = 1;
      }
      if (inner) inner.style.transition = innerTransition;
      siblings.forEach((item, index) => { item.style.transition = siblingTransitions[index]; });
    };
  }, [card]);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline || !pageReady || pageTweenAdded.current) return;
    pageTweenAdded.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Start the reveal while the card is still finishing its move. If the page mounted late,
    // start at the current playhead instead so nothing is scheduled in the past.
    const start = Math.max(timeline.time(), revealAtRef.current);
    const fade = reduced ? 0.2 : 0.3;
    const revealEase = reduced ? 'none' : 'power2.out';
    timeline.to(card, { opacity: 0, duration: fade, ease: revealEase }, start);
    timeline.to('.section-page[data-transition-content]', { opacity: 1, duration: fade, ease: revealEase }, start);
    timeline.to('.section-page[data-transition-content] .section-page-content', {
      opacity: 1, y: 0, duration: reduced ? 0.2 : 0.4,
      ease: reduced ? 'none' : 'power3.out',
    }, start);
    timeline.to(backdropRef.current, { opacity: 0, duration: fade, ease: revealEase }, start);
    timeline.play();
  }, [card, pageReady]);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    if (direction === 'close') {
      timeline.timeScale(CLOSE_SPEED).reverse();
    }
  }, [direction]);

  return <div ref={backdropRef} className="section-transition-backdrop" aria-hidden="true" />;
}
