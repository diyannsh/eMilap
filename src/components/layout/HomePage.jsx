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
  'Account Settings': 'Manage your e-Milap account preferences.',
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
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [showSectionProgress, setShowSectionProgress] = useState(false);

  useLayoutEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.1 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // On mobile we skip the horizontal pin — cards are displayed vertically via CSS.
    const isMobile = window.matchMedia('(max-width: 700px)').matches;

    const ctx = gsap.context(() => {
      gsap.from('.hm-char', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.06 });
      gsap.from('.hm-fade', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.35 });

      const track = trackRef.current;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

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
              setActiveIndex(index);
            }
          },
        },
      });
      stRef.current = tween.scrollTrigger;
      ScrollTrigger.refresh();

      // SYNCHRONOUS PRE-PAINT POSITION RESTORATION:
      if (restoreSection && typeof restoreSection.index === 'number' && restoreSection.index >= 0 && !restoreSection.fromHero) {
        const total = Math.max(1, sections.length - 1);
        const progress = Math.min(1, Math.max(0, restoreSection.index / total));
        const totalDist = distance();
        const st = tween.scrollTrigger;
        const targetScroll = Math.round(st.start + totalDist * progress);

        track.style.transform = `translate3d(${-totalDist * progress}px, 0px, 0px)`;
        tween.progress(progress);

        window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' });
        lenis.scrollTo(targetScroll, { immediate: true, force: true });

        st.scroll(targetScroll);
        st.progress = progress;
        ScrollTrigger.update();

        const step = window.matchMedia('(max-width: 700px)').matches ? 23 : 28;
        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
        if (progressFillRef.current) progressFillRef.current.style.transform = `translateX(-50%) scaleY(${progress})`;
        if (progressThumbRef.current) progressThumbRef.current.style.transform = `translateY(${progress * (sections.length - 1) * step}px)`;
        setActiveIndex(restoreSection.index);
        activeIndexRef.current = restoreSection.index;
        setShowSectionProgress(true);
        onSliderChange?.(true);
      }
    }, rootRef);

    return () => {
      onSliderChange?.(false);
      ctx.revert();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
      stRef.current = null;
    };
  }, [restoreSection]);

  const scrollToSections = () => {
    const top = stRef.current?.start ?? 0;
    if (lenisRef.current) lenisRef.current.scrollTo(top);
    else window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="hm" ref={rootRef}>
      <section className="hm-hero">
        <p className="hm-eyebrow hm-fade">Campus Lost &amp; Found</p>
        <h1 className="hm-title" aria-label="e-Milap">
          {[...'e-Milap'].map((c, i) => (
            <span className="hm-char-wrap" key={i}><span className="hm-char">{c}</span></span>
          ))}
        </h1>
        <p className="hm-headline hm-fade">Lost something on campus? Let&apos;s get it back to you.</p>
        <p className="hm-lede hm-fade">
          e-Milap connects people who lost an item with the people who found it. Report it, review possible
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
              <span className="hm-card-desc">{DESC[item.label] ?? 'Use e-Milap to report, find, and return items on campus.'}</span>
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
