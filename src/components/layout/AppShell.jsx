import { useEffect, useRef, useState } from 'react';
import { LogIn, LogOut, Settings2, ShieldCheck, User, UserPlus } from 'lucide-react';
import MochaFlowerBackground from '../canvas/MochaFlowerBackground.jsx';
import GlassSurface from '../ui/GlassSurface.jsx';
import AccountAccess from '../account/AccountAccess.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMockStore } from '../../data/mockStore.js';
import { MapPin } from '../../lib/icons.js';
import './AppShell.css';

export default function AppShell({ activeView, navigationItems, onNavigate, transitioning = false, children }) {
  const mainRef = useRef(null);
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, unreadCount: authUnreadCount } = useAuth();
  const { notifications } = useMockStore();
  const mockUnreadCount = notifications.filter((n) => !n.read).length;
  const unreadCount = authUnreadCount || mockUnreadCount;
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
    return () => {
      document.body.style.overflow = '';
    };
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

  const sectionItems = navigationItems.filter((item) => item.id !== 'dashboard');

  return (
    <div className="relative min-h-screen w-full bg-[#0E0805] text-[#E5E4E2]">
      <main
        ref={mainRef}
        tabIndex={-1}
        className="app-main relative flex min-h-screen w-full flex-col outline-none overflow-x-clip"
      >
        <MochaFlowerBackground activeView={activeView} />

        {/* ─────────────────────────────────────────────────────────
            DESKTOP HEADER (xl and above)
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

          {/* Navigation icons */}
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isAccount = item.id === 'settings';
              const isNotifications = item.id === 'notifications';
              const selected = activeView === item.id || (isAccount && accountMenuOpen);
              return (
                <div className={`relative ${isAccount ? 'account-menu-anchor' : ''}`} key={item.id} ref={isAccount ? accountMenuRef : undefined}>
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
                      {isNotifications && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E6E0F0] px-1 text-[9px] font-bold text-black shadow ring-2 ring-[#231713]">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </GlassSurface>

                  {isAccount && accountMenuOpen && (
                    <div className="account-menu" role="menu" aria-label="Account menu">
                      {user ? (
                        <>
                          <div className="px-3 py-2 border-b border-[#6F4E37]/40 mb-1">
                            <p className="text-xs font-semibold text-[#FAF9F8] truncate">{user.displayName || user.email}</p>
                            <p className="text-[10px] text-[#E5E4E2]/70 truncate">{user.email}</p>
                            {user.role && user.role !== 'MEMBER' && (
                              <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#C68B59] bg-[#6F4E37]/30 px-1.5 py-0.5 rounded border border-[#6F4E37]/50">
                                <ShieldCheck size={10} /> {user.role}
                              </span>
                            )}
                          </div>
                          <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onNavigate('settings'); }}>
                            <Settings2 size={17} aria-hidden="true" />
                            <span>Account settings</span>
                          </button>
                          <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); logout(); }}>
                            <LogOut size={17} aria-hidden="true" />
                            <span>Sign out</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="account-menu-heading">Your account</p>
                          <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); openAuth('login'); }}>
                            <LogIn size={17} aria-hidden="true" />
                            <span>Sign in</span>
                          </button>
                          <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); openAuth('signup'); }}>
                            <UserPlus size={17} aria-hidden="true" />
                            <span>Create account</span>
                          </button>
                          <div className="account-menu-divider" />
                          <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onNavigate('settings'); }}>
                            <Settings2 size={17} aria-hidden="true" />
                            <span>Account settings</span>
                          </button>
                        </>
                      )}
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
              {user?.communityName || 'Campus community'}
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────
            MOBILE HEADER (below xl)
        ───────────────────────────────────────────────────────── */}
        <header className="fixed inset-x-3 top-3 z-40 mx-auto flex w-[calc(100%-1.5rem)] items-center justify-between rounded-[22px] border border-[#E5E4E2]/15 bg-[#231713]/90 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-xl xl:hidden">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left"
            aria-label="Go to eMilap sections"
          >
            <MapPin className="text-[#E6E0F0]" size={22} />
            <span>
              <span className="block text-lg font-bold leading-none text-[#FAF9F8]">eMilap</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#E5E4E2]/65">Campus Lost &amp; Found</span>
            </span>
          </button>

          {/* Right Side: Back button + Hamburger Menu toggle */}
          <div className="flex items-center gap-2">
            {activeView !== 'dashboard' && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="rounded-full border border-[#6F4E37]/60 bg-[#2C1C16]/90 px-3 py-1.5 text-xs font-medium text-[#E5E4E2] backdrop-blur transition-colors hover:border-[#E6E0F0]/60 hover:bg-[#3D261E]"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              className={`mobile-nav-toggle${mobileMenuOpen ? ' is-active' : ''}`}
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <span className="mobile-nav-toggle-text">
                {mobileMenuOpen ? 'CLOSE' : 'MENU'}
              </span>
              <span className="mobile-nav-burger" aria-hidden="true">
                <span className="mobile-nav-burger-line" />
                <span className="mobile-nav-burger-line" />
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
              const isNotifications = item.id === 'notifications';
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
                    {isNotifications && unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] bg-[#E6E0F0]/25 text-[#E6E0F0] border border-[#E6E0F0]/40 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Quick Account Actions inside Mobile Overlay */}
          <div className="pt-4 border-t border-[#6F4E37]/30 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between text-xs py-2 px-1 text-[#E5E4E2]">
                <span className="truncate font-semibold">{user.displayName || user.email}</span>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="text-[#C68B59] hover:underline font-semibold px-2.5 py-1 rounded bg-[#6F4E37]/20 border border-[#6F4E37]/40"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); openAuth('login'); }}
                  className="flex-1 py-2 rounded-xl bg-[#6F4E37] text-xs font-semibold text-[#FAF9F8] text-center"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); openAuth('signup'); }}
                  className="flex-1 py-2 rounded-xl bg-[#2C1C16] border border-[#6F4E37]/60 text-xs font-semibold text-[#FAF9F8] text-center"
                >
                  Create account
                </button>
              </div>
            )}
          </div>

          {/* Footer strip */}
          <div className="mobile-nav-footer mt-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#EAAA00]" />
              <span className="text-xs font-medium text-[#E5E4E2]/70 uppercase tracking-widest">
                {user?.communityName || 'Campus community'}
              </span>
            </div>
          </div>
        </div>

        {authMode && <AccountAccess initialMode={authMode} onClose={closeAuth} />}

        {/* Header spacer */}
        <div className="h-[68px] shrink-0 xl:h-20" aria-hidden="true" />

        <div data-lenis-content className="relative z-10 flex w-full flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
