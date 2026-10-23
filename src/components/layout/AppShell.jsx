import { useEffect, useRef, useState } from 'react';
import { LogIn, Settings2, UserPlus } from 'lucide-react';
import GridScan from '../canvas/GridScan.jsx';
import GlassSurface from '../ui/GlassSurface.jsx';
import AccountAccess from '../account/AccountAccess.jsx';
import { MapPin } from '../../lib/icons.js';
import './AppShell.css';

export default function AppShell({ activeView, navigationItems, onNavigate, transitioning = false, children }) {
  const mainRef = useRef(null);
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const activeLabel = navigationItems.find((item) => item.id === activeView)?.label ?? 'Sections';

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [accountMenuOpen]);

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

        <header className="fixed inset-x-3 top-3 z-40 mx-auto flex w-[calc(100%-1.5rem)] max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[28px] border border-white/10 bg-[#17181b]/55 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-xl xl:flex-nowrap xl:px-5">
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

          <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-center gap-0.5 xl:order-none xl:w-auto xl:gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isAccount = item.id === 'settings';
              const selected = activeView === item.id || (isAccount && accountMenuOpen);
              return (
                <div className="account-menu-anchor" key={item.id} ref={isAccount ? accountMenuRef : undefined}>
                  <GlassSurface
                    width={42}
                    height={42}
                    borderRadius={21}
                    distortionScale={-80}
                    displace={0.12}
                    backgroundOpacity={0.12}
                    className={`section-nav-glass shrink-0 ${selected ? 'section-nav-glass-active' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isAccount) {
                          setAccountMenuOpen((open) => !open);
                          return;
                        }
                        if (selected && item.id === 'dashboard') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          return;
                        }
                        onNavigate(item.id);
                      }}
                      aria-label={item.label}
                      aria-current={selected && !isAccount ? 'page' : undefined}
                      aria-haspopup={isAccount ? 'menu' : undefined}
                      aria-expanded={isAccount ? accountMenuOpen : undefined}
                      title={item.label}
                      className="section-nav-icon-button"
                    >
                      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </GlassSurface>
                  {isAccount && accountMenuOpen && (
                    <div className="account-menu" role="menu" aria-label="Account menu">
                      <p className="account-menu-heading">Your account</p>
                      <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); setAuthMode('login'); }}>
                        <LogIn size={17} aria-hidden="true" />
                        <span>Sign in</span>
                      </button>
                      <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); setAuthMode('signup'); }}>
                        <UserPlus size={17} aria-hidden="true" />
                        <span>Create account</span>
                      </button>
                      <div className="account-menu-divider" />
                      <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onNavigate('settings'); }}>
                        <Settings2 size={17} aria-hidden="true" />
                        <span>Account settings</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

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

        {authMode && <AccountAccess initialMode={authMode} onClose={() => setAuthMode(null)} />}

        <div className="h-[144px] shrink-0 xl:h-20" aria-hidden="true" />

        <div data-lenis-content className="relative z-10 flex w-full flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
