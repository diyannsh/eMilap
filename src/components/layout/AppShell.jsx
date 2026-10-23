import { useEffect, useRef, useState } from 'react';
import { LogIn, Settings2, UserPlus } from 'lucide-react';
import MochaFlowerBackground from '../canvas/MochaFlowerBackground.jsx';
import GlassSurface from '../ui/GlassSurface.jsx';
import AccountAccess from '../account/AccountAccess.jsx';
import { useMockStore } from '../../data/mockStore.js';
import { MapPin } from '../../lib/icons.js';
import './AppShell.css';

export default function AppShell({ activeView, navigationItems, onNavigate, transitioning = false, children }) {
  const mainRef = useRef(null);
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notifications } = useMockStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeLabel = navigationItems.find((item) => item.id === activeView)?.label ?? 'Sections';

  const openAuth = (mode) => {
    const currentState = window.history.state ?? {};
    window.history.pushState({ ...currentState, __emilapAuth: mode }, '');
    setAuthMode(mode);
  };

  const closeAuth = () => {
    if (window.history.state?.__emilapAuth) {
      window.history.back();
    } else {
      setAuthMode(null);
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [accountMenuOpen]);

  useEffect(() => {
    const handleAuthHistory = (event) => {
      setAuthMode(event.state?.__emilapAuth ?? null);
    };
    window.addEventListener('popstate', handleAuthHistory);
    return () => window.removeEventListener('popstate', handleAuthHistory);
  }, []);

  const handleMobileNav = (id) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  // Sections only (no dashboard item) for mobile menu listing
  const sectionItems = navigationItems.filter((item) => item.id !== 'dashboard');

  return (
    <div className="relative min-h-screen w-full bg-[#0E0805] font-sans text-platinum-500" style={{ backgroundColor: '#0E0805' }}>
      <main
        ref={mainRef}
        className="app-main relative flex min-h-screen w-full flex-col"
      >
        <MochaFlowerBackground activeView={activeView} />

        {/* ─────────────────────────────────────────────────────────
            DESKTOP HEADER  (xl and above, unchanged)
        ───────────────────────────────────────────────────────── */}
        <header className="fixed inset-x-3 top-3 z-40 mx-auto hidden w-[calc(100%-1.5rem)] max-w-[1400px] xl:flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[28px] border border-[#E5E4E2]/15 bg-[#231713]/85 px-5 py-2 shadow-lg shadow-black/10 backdrop-blur-xl flex-nowrap">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 rounded-xl text-left transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E6E0F0]"
            aria-label="Go to eMilap sections"
          >
            <MapPin className="text-[#E6E0F0]" size={25} />
            <span>
              <span className="block text-xl font-bold leading-none text-[#FAF9F8]">eMilap</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E5E4E2]/70">Campus Lost &amp; Found</span>
            </span>
          </button>

          {/* Nav icons */}
          <nav aria-label="Main navigation" className="flex items-center gap-2">
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
                        if (isAccount) { setAccountMenuOpen((o) => !o); return; }
                        if (selected && item.id === 'dashboard') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
                        onNavigate(item.id);
                      }}
                      aria-label={item.label}
                      aria-current={selected && !isAccount ? 'page' : undefined}
                      aria-haspopup={isAccount ? 'menu' : undefined}
                      aria-expanded={isAccount ? accountMenuOpen : undefined}
                      title={item.label}
                      className="section-nav-icon-button relative"
                    >
                      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E6E0F0] ring-2 ring-[#231713]" />
                      )}
                    </button>
                  </GlassSurface>
                  {isAccount && accountMenuOpen && (
                    <div className="account-menu" role="menu" aria-label="Account menu">
                      <p className="account-menu-heading">Your account</p>
                      <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); openAuth('login'); }}>
                        <LogIn size={17} aria-hidden="true" /><span>Sign in</span>
                      </button>
                      <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); openAuth('signup'); }}>
                        <UserPlus size={17} aria-hidden="true" /><span>Create account</span>
                      </button>
                      <div className="account-menu-divider" />
                      <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onNavigate('settings'); }}>
                        <Settings2 size={17} aria-hidden="true" /><span>Account settings</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {(activeView !== 'dashboard' || transitioning) && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="section-nav-back rounded-full border border-[#6F4E37]/50 bg-[#2C1C16]/85 px-4 py-2 text-sm font-medium text-[#E5E4E2] backdrop-blur transition-colors hover:border-[#E6E0F0]/60 hover:bg-[#3D261E]"
              >
                ← All sections
                <span className="sr-only"> (current: {activeLabel})</span>
              </button>
            )}
            <div className="flex items-center gap-2 rounded-full border border-[#6F4E37]/45 bg-[#2C1C16]/85 px-4 py-2 text-xs font-medium text-[#E5E4E2] backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#EAAA00]" />
              Campus community
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────
            MOBILE HEADER  (below xl)
        ───────────────────────────────────────────────────────── */}
        <header className="fixed inset-x-3 top-3 z-40 mx-auto flex w-[calc(100%-1.5rem)] items-center justify-between rounded-[22px] border border-[#E5E4E2]/15 bg-[#231713]/90 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-xl xl:hidden">
          {/* Logo */}
          <button
            type="button"
            onClick={() => { setMobileMenuOpen(false); onNavigate('dashboard'); }}
            className="flex items-center gap-2.5 rounded-xl text-left transition hover:opacity-80"
            aria-label="Go home"
          >
            <MapPin className="text-[#E6E0F0]" size={22} />
            <span>
              <span className="block text-lg font-bold leading-none text-[#FAF9F8]">eMilap</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#E5E4E2]/65">Campus Lost &amp; Found</span>
            </span>
          </button>

          {/* Right side: back button (in section) + MENU toggle */}
          <div className="flex items-center gap-2">
            {(activeView !== 'dashboard' || transitioning) && !mobileMenuOpen && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="rounded-full border border-[#6F4E37]/50 bg-[#2C1C16]/85 px-3 py-1.5 text-xs font-semibold text-[#E5E4E2] backdrop-blur"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="mobile-menu-toggle"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <span className="mobile-menu-toggle-text">{mobileMenuOpen ? 'CLOSE' : 'MENU'}</span>
              <span className="mobile-menu-toggle-lines" aria-hidden="true">
                <span className={mobileMenuOpen ? 'line-1 open' : 'line-1'} />
                <span className={mobileMenuOpen ? 'line-2 open' : 'line-2'} />
              </span>
            </button>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────
            MOBILE FULL-SCREEN MENU OVERLAY
        ───────────────────────────────────────────────────────── */}
        <div
          className={`mobile-nav-overlay xl:hidden${mobileMenuOpen ? ' is-open' : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          <nav className="mobile-nav-list" aria-label="Mobile navigation">
            {sectionItems.map((item, i) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-nav-item${isActive ? ' is-active' : ''}`}
                  onClick={() => handleMobileNav(item.id)}
                  style={{ transitionDelay: mobileMenuOpen ? `${i * 55}ms` : '0ms' }}
                >
                  <span className="mobile-nav-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mobile-nav-label inline-flex items-center gap-2">
                    {item.label}
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] bg-[#E6E0F0]/25 text-[#E6E0F0] border border-[#E6E0F0]/40 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Footer strip */}
          <div className="mobile-nav-footer">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#EAAA00]" />
              <span className="text-xs font-medium text-[#E5E4E2]/70 uppercase tracking-widest">Campus community</span>
            </div>
          </div>
        </div>

        {authMode && <AccountAccess initialMode={authMode} onClose={closeAuth} />}

        {/* Spacer matching header height */}
        <div className="h-[68px] shrink-0 xl:h-20" aria-hidden="true" />

        <div data-lenis-content className="relative z-10 flex w-full flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
