import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './HomePage.css';

gsap.registerPlugin(ScrollTrigger);

const DESC = {
  'Report Lost': 'Describe the item you lost and where you last remember having it.',
  'Report Found': 'Share where you found an item so its owner can identify it.',
  'Campus Listings': 'Browse example lost-and-found reports from around campus.',
  'Possible Matches': 'Review reports with details that may match an item you reported.',
  'Ownership Claims': 'Review the private details used to confirm the owner of an item.',
  Updates: 'Find updates related to your lost-and-found reports.',
  Moderation: 'Review reports and ownership claims that may need attention.',
  'Account Settings': 'Manage your eMilap account preferences.',
};

const SECTION_IMAGES = {
  report_lost: '/images/Report_lost.webp',
  report_found: '/images/Report_found.webp',
  browse: '/images/Campus_listings.webp',
  matches: '/images/Possible_matches.webp',
  claims: '/images/Ownership_claims.webp',
  notifications: '/images/Updates.webp',
  admin: '/images/Moderation.webp',
  settings: '/images/Account-settings.webp',
};

const STEPS = [
  ['01', 'Report', 'Tell us what you lost or found, and where.'],
  ['02', 'Match', 'Reports are compared by details, category and location.'],
  ['03', 'Claim', 'Owners confirm with private details before anything is returned.'],
];

export default function HomePage({ items, onSelect, restoreSection = null, onSliderChange }) {
  const rootRef = useRef(null);
  const galleryRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const stRef = useRef(null);
  const lenisRef = useRef(null);
  const progressFillRef = useRef(null);
  const progressThumbRef = useRef(null);
  const progressLabelRef = useRef(null);

  const sections = items.filter((item) => item.id !== 'dashboard');
  const savedIndex = Number.parseInt(window.sessionStorage.getItem('activeSectionIdx') ?? '', 10);
  const initialIndex = Number.isInteger(savedIndex) && savedIndex >= 0
    ? Math.min(savedIndex, Math.max(0, sections.length - 1))
    : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeIndexRef = useRef(initialIndex);
  const [showSectionProgress, setShowSectionProgress] = useState(false);

  useLayoutEffect(() => {
    let ctx;
    let lenis;
    let tick;
    lenis = new Lenis({ smoothWheel: true, lerp: 0.1 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // On mobile we skip the horizontal pin — cards are displayed vertically via CSS.
    const isMobile = window.matchMedia('(max-width: 700px)').matches;

    ctx = gsap.context(() => {
      gsap.from('.hm-char', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.06 });
      gsap.from('.hm-fade', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.35 });

      const track = trackRef.current;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const storedIndex = Number.parseInt(window.sessionStorage.getItem('activeSectionIdx') ?? '', 10);
      const storedRestoreIndex = Number.isInteger(storedIndex) && storedIndex >= 0
        ? storedIndex
        : restoreSection?.index;
      const restoreIndex = typeof storedRestoreIndex === 'number'
        ? Math.min(storedRestoreIndex, Math.max(0, sections.length - 1))
        : storedRestoreIndex;
      const restoreProgress = typeof restoreIndex === 'number' && restoreIndex >= 0 && !restoreSection?.fromHero
        ? Math.min(1, Math.max(0, restoreIndex / Math.max(1, sections.length - 1)))
        : 0;

      // Establish the restored position before ScrollTrigger creates or renders its tween.
      gsap.set(track, { x: -distance() * restoreProgress });

      // Skip horizontal pin on mobile — vertical CSS layout handles it
      if (isMobile) return;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: galleryRef.current,
          pin: true,
          scrub: true,
          start: 'top top',
          end: () => `+=${distance()}`,
          invalidateOnRefresh: true,
          onEnter: () => {
            setShowSectionProgress(true);
            onSliderChange?.(true);
          },
          onEnterBack: () => {
            setShowSectionProgress(true);
            onSliderChange?.(true);
          },
          onLeave: () => {
            setShowSectionProgress(false);
            onSliderChange?.(false);
          },
          onLeaveBack: () => {
            setShowSectionProgress(false);
            onSliderChange?.(false);
          },
          onUpdate: (self) => {
            const progress = self.progress;
            const index = Math.round(progress * Math.max(0, sections.length - 1));
            const step = window.matchMedia('(max-width: 700px)').matches ? 23 : 28;
            if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
            if (progressFillRef.current) progressFillRef.current.style.transform = `translateX(-50%) scaleY(${progress})`;
            if (progressThumbRef.current) progressThumbRef.current.style.transform = `translateY(${progress * Math.max(0, sections.length - 1) * step}px)`;
            if (index !== activeIndexRef.current) {
              activeIndexRef.current = index;
              window.sessionStorage.setItem('activeSectionIdx', String(index));
              setActiveIndex(index);
            }
          },
        },
      });
      stRef.current = tween.scrollTrigger;
      ScrollTrigger.refresh();

      // SYNCHRONOUS PRE-PAINT POSITION RESTORATION:
      // If returning to a section slide, restore scroll and track transform BEFORE browser paints!
      if (typeof restoreIndex === 'number' && restoreIndex >= 0 && !restoreSection?.fromHero) {
        const total = Math.max(1, sections.length - 1);
        const progress = Math.min(1, Math.max(0, restoreIndex / total));
        const totalDist = distance();
        const st = tween.scrollTrigger;
        const targetScroll = Math.round(st.start + totalDist * progress);

        // 1. Instantly apply track transform so there is zero layout jump or flicker
        gsap.set(track, { x: -totalDist * progress });
        tween.progress(progress);

        // 2. Instantly scroll window and Lenis
        window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' });
        lenis.scrollTo(targetScroll, { immediate: true, force: true });

        // 3. Sync ScrollTrigger state immediately with zero lag
        st.scroll(targetScroll);
        st.progress = progress;
        ScrollTrigger.update();

        // 4. Update visual indicators
        const step = window.matchMedia('(max-width: 700px)').matches ? 23 : 28;
        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
        if (progressFillRef.current) progressFillRef.current.style.transform = `translateX(-50%) scaleY(${progress})`;
        if (progressThumbRef.current) progressThumbRef.current.style.transform = `translateY(${progress * (sections.length - 1) * step}px)`;
        setActiveIndex(restoreIndex);
        activeIndexRef.current = restoreIndex;
        setShowSectionProgress(true);
        onSliderChange?.(true);
      }
    }, rootRef);

    return () => {
      onSliderChange?.(false);
      ctx?.revert();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      lenisRef.current = null;
      stRef.current = null;
    };
  }, []);

  const scrollToSections = () => {
    const top = stRef.current?.start ?? 0;
    if (lenisRef.current) lenisRef.current.scrollTo(top);
    else window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="hm" ref={rootRef}>
      <section className="hm-hero">
        <p className="hm-eyebrow hm-fade">Campus Lost &amp; Found</p>
        <h1 className="hm-title" aria-label="eMilap">
          {[...'eMilap'].map((c, i) => (
            <span className="hm-char-wrap" key={i}><span className="hm-char">{c}</span></span>
          ))}
        </h1>
        <p className="hm-headline hm-fade">Lost something on campus? Let&apos;s get it back to you.</p>
        <p className="hm-lede hm-fade">
          eMilap connects people who lost an item with the people who found it. Report it, review possible
          matches, and confirm ownership with private details, all in one place.
        </p>
        <div className="hm-cta hm-fade">
          <button type="button" className="hm-btn hm-btn-solid" onClick={() => onSelect('report_lost', { fromHero: true })}>
            Report a lost item
          </button>
          <button type="button" className="hm-btn" onClick={scrollToSections}>
            Explore sections ↓
          </button>
        </div>
        <ol className="hm-steps hm-fade">
          {STEPS.map(([n, t, d]) => (
            <li key={n}><span>{n}</span><strong>{t}</strong><p>{d}</p></li>
          ))}
        </ol>
      </section>

      <div className="hm-marquee" aria-hidden="true">
        <div>{[0, 1].map((i) => <span key={i}>{'REPORT — MATCH — CLAIM — RETURN — '.repeat(4)}</span>)}</div>
      </div>

      <section
        className="hm-gallery"
        ref={galleryRef}
        id="sections"
        onScroll={(e) => {
          e.currentTarget.scrollLeft = 0;
        }}
      >
        <div className="hm-track" ref={trackRef}>
          <div className="hm-gallery-intro">
            <p className="hm-eyebrow">02 — Services</p>
            <h2>SECTIONS</h2>
            <p>Scroll to explore. Click any card to open it.</p>
          </div>
          {sections.map((item, i) => (
            <button
              type="button"
              className="hm-card"
              key={item.id}
              onMouseDown={(e) => {
                // Prevent browser focus-scroll algorithm from displacing the transformed carousel on click
                e.preventDefault();
              }}
              onClick={() => onSelect(item.id, { index: i })}
            >
              <img
                className="hm-card-image"
                src={SECTION_IMAGES[item.id]}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src.endsWith('.webp')) {
                    e.currentTarget.src = SECTION_IMAGES[item.id].replace('.webp', '.jpg');
                  }
                }}
              />
              <span className="hm-card-meta"><span>{String(i + 1).padStart(2, '0')}</span><span>Open →</span></span>
              <span className="hm-card-title">{item.label}</span>
              <span className="hm-card-desc">{DESC[item.label] ?? 'Use eMilap to report, find, and return items on campus.'}</span>
            </button>
          ))}
          <div className="hm-track-end" />
        </div>
        <div className="hm-progress"><i ref={barRef} /></div>
      </section>

      <aside className={`hm-section-progress${showSectionProgress ? ' is-visible' : ''}`} aria-label="Section progress">
        <span className="hm-section-count">{String(activeIndex + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}</span>
        <div className="hm-section-rail">
          <span className="hm-section-rail-track" aria-hidden="true" />
          <span ref={progressFillRef} className="hm-section-rail-fill" aria-hidden="true" />
          <span
            ref={progressThumbRef}
            className="hm-section-rail-thumb"
            aria-hidden="true"
          />
          <span
            ref={progressLabelRef}
            className="hm-section-active-label"
            style={{ transform: `translateY(${activeIndex * (typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches ? 23 : 28)}px) translateY(-50%)` }}
          >
            {sections[activeIndex]?.label}
          </span>
          <div className="hm-section-dots">
            {sections.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`hm-section-dot${index === activeIndex ? ' is-active' : ''}`}
                aria-label={`Go to ${item.label}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => {
                  const trigger = stRef.current;
                  if (!trigger) return;
                  const progress = sections.length > 1 ? index / (sections.length - 1) : 0;
                  const top = trigger.start + (trigger.end - trigger.start) * progress;
                  lenisRef.current?.scrollTo(top, { duration: 0.8 });
                }}
              />
            ))}
          </div>
        </div>
      </aside>

      <footer className="hm-footer">
        <h2>Found something?</h2>
        <p>Help it find its way back to its owner.</p>
        <button type="button" className="hm-btn hm-btn-solid" onClick={() => onSelect('report_found', { fromFooter: true })}>
          Report a found item
        </button>
      </footer>
    </div>
  );
}
