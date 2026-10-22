import { useRef } from 'react';
import GridScan from '../canvas/GridScan.jsx';
import { MapPin } from '../../lib/icons.js';

export default function AppShell({ activeView, navigationItems, onNavigate, transitioning = false, children }) {
  const mainRef = useRef(null);
  const activeLabel = navigationItems.find((item) => item.id === activeView)?.label ?? 'Sections';

  return (
    <div className="relative min-h-screen w-full bg-cocoa-950 font-sans text-platinum-500" style={{ backgroundColor: '#101113' }}>
      <main
        ref={mainRef}
        className="app-main relative flex min-h-screen w-full flex-col"
        onPointerMove={(event) => {
          const main = event.currentTarget;
          const bounds = main.getBoundingClientRect();
          const background = main.querySelector('.grid-scan');
          if (!background) return;
          const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
          const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
          background.style.setProperty('--pointer-x', `${(x - 0.5) * 8}deg`);
          background.style.setProperty('--pointer-y', `${(y - 0.5) * -5}deg`);
          background.style.setProperty('--pointer-x-pos', `${x * 100}%`);
          background.style.setProperty('--pointer-y-pos', `${y * 100}%`);
        }}
        onPointerLeave={(event) => {
          const background = event.currentTarget.querySelector('.grid-scan');
          if (!background) return;
          background.style.setProperty('--pointer-x', '0deg');
          background.style.setProperty('--pointer-y', '0deg');
          background.style.setProperty('--pointer-x-pos', '50%');
          background.style.setProperty('--pointer-y-pos', '42%');
        }}
      >
        <GridScan
          className="pointer-events-none fixed inset-0 z-0"
          style={{ position: 'fixed', inset: 0, height: '100vh' }}
          linesColor="#4a4d54"
          scanColor="#d8dade"
          cells={8}
          depth={3}
          clickEffect="none"
        />

        <header className="relative z-20 flex h-20 shrink-0 items-center justify-between px-6 md:px-10">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 rounded-xl text-left transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lavender-300"
            aria-label="Go to eMilap sections"
          >
            <MapPin className="text-lavender-300" size={25} />
            <span>
              <span className="block text-xl font-bold leading-none text-platinum-400">eMilap</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-platinum-500/65">Campus Lost &amp; Found</span>
            </span>
          </button>

          {(activeView !== 'dashboard' || transitioning) && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="section-nav-back rounded-full border border-mocha-700 bg-mocha-900/80 px-4 py-2 text-sm font-medium text-platinum-400 backdrop-blur transition-colors hover:border-lavender-500/60 hover:bg-mocha-800"
            >
              ← All sections
              <span className="sr-only"> (current: {activeLabel})</span>
            </button>
          )}

          <div className="flex items-center gap-2 rounded-full border border-mocha-700 bg-mocha-900/80 px-4 py-2 text-xs font-medium text-platinum-400 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lavender-300" />
            Campus community
          </div>
        </header>

        <div data-lenis-content className="relative z-10 flex w-full flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
