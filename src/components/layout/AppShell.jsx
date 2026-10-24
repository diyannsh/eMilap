import { useEffect, useRef, useState } from 'react';
import { LogIn, LogOut, Settings2, ShieldCheck, User, UserPlus } from 'lucide-react';
import Topography from '../canvas/Topography.jsx';
import GlassSurface from '../ui/GlassSurface.jsx';
import AccountAccess from '../account/AccountAccess.jsx';
import ChatbotWidget from '../chat/ChatbotWidget.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { MapPin } from '../../lib/icons.js';
import './AppShell.css';

export default function AppShell({ activeView, navigationItems, onNavigate, transitioning = false, children }) {
  const { user, logout, unreadCount } = useAuth();
  const mainRef = useRef(null);
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
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

  return (
    <div className="relative min-h-screen w-full bg-cocoa-950 font-sans text-platinum-500" style={{ backgroundColor: '#1E1310' }}>
      <main
        ref={mainRef}
        className="app-main relative flex min-h-screen w-full flex-col"
      >
        <Topography
          className="pointer-events-none fixed inset-0 z-0"
          style={{ position: 'fixed', inset: 0, height: '100vh' }}
          color="#C68B59"
          lineCount={26}
          lineWidth={1.3}
          elevation={1.15}
          foreground={0.2}
          tilt={32}
          speed={0.16}
          direction="forward"
          morph={0.32}
          glow={0.58}
          depthOfField={0.32}
          fog={0.42}
          hoverEffect="lift"
          mouseStrength={0.68}
          mouseRadius={1.4}
          trail={0.22}
          parallax={0.32}
          markers="dots"
          clickEffect="none"
        />

        <header className="fixed inset-x-3 top-3 z-40 mx-auto flex w-[calc(100%-1.5rem)] max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[28px] border border-white/10 bg-[#1d1c1f]/75 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-xl xl:flex-nowrap xl:px-5">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 rounded-xl text-left transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lavender-300"
            aria-label="Go to e-Milap sections"
          >
            <MapPin className="text-lavender-300" size={25} />
            <span>
              <span className="block text-xl font-bold leading-none text-platinum-400">e-Milap</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-platinum-500/65">Campus Lost &amp; Found</span>
            </span>
          </button>

          <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-center gap-0.5 xl:order-none xl:w-auto xl:gap-2">
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
                      className="section-nav-icon-button relative"
                    >
                      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                      {isNotifications && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal-500 px-1 text-[9px] font-bold text-black shadow">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </GlassSurface>
                  {isAccount && accountMenuOpen && (
                    <div className="account-menu" role="menu" aria-label="Account menu">
                      {user ? (
                        <>
                          <div className="px-3 py-2 border-b border-mocha-700/60">
                            <p className="text-xs font-semibold text-platinum-400 truncate">{user.displayName}</p>
                            <p className="text-[10px] text-platinum-500/75 truncate">{user.email}</p>
                            {user.role && user.role !== 'MEMBER' && (
                              <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-signal-400 bg-signal-500/10 px-1.5 py-0.5 rounded">
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
            <span className="h-2 w-2 animate-pulse rounded-full bg-signal-400" />
            {user?.communityName || 'Campus community'}
          </div>
        </header>

        {authMode && <AccountAccess initialMode={authMode} onClose={closeAuth} />}

        <div className="h-[144px] shrink-0 xl:h-20" aria-hidden="true" />

        <div data-lenis-content className="relative z-10 flex w-full flex-1 flex-col">
          {children}
        </div>

        <ChatbotWidget onNavigate={onNavigate} />
      </main>
    </div>
  );
}
