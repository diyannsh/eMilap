import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AdminView from './components/admin/AdminView.jsx';
import BrowseView from './components/browse/BrowseView.jsx';
import ClaimsView from './components/claims/ClaimsView.jsx';
import AppShell from './components/layout/AppShell.jsx';
import HomePage from './components/layout/HomePage.jsx';
import SectionPage from './components/layout/SectionPage.jsx';
import MatchesView from './components/matches/MatchesView.jsx';
import ReportFormView from './components/reports/ReportFormView.jsx';
import EmptyPlaceholder from './components/ui/EmptyPlaceholder.jsx';
import { navigationItems } from './data/navigation.js';
import AccountSettingsView from './components/account/AccountSettingsView.jsx';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const curtain = useRef(null);
  const busy = useRef(false);
  const queuedView = useRef(null);
  const goRef = useRef(null);
  const lastSectionRef = useRef({ id: null, index: -1, fromHero: false });

  // Page change: a curtain wipes up over the screen, the view swaps underneath, then it wipes away.
  const go = (id, maybeOpts = {}) => {
    let options = {};
    if (typeof maybeOpts === 'object' && maybeOpts !== null) {
      options = maybeOpts;
    }
    const { fromHistory = false, index, fromHero = false, fromFooter = false } = options;

    if (busy.current) return;
    if (id === activeView) return;
    if (id !== 'dashboard' && !navigationItems.some((item) => item.id === id)) return;

    if (id !== 'dashboard') {
      const sectionItems = navigationItems.filter((item) => item.id !== 'dashboard');
      const targetIndex = index !== undefined ? index : sectionItems.findIndex((item) => item.id === id);
      lastSectionRef.current = {
        id,
        index: targetIndex >= 0 ? targetIndex : 0,
        fromHero: Boolean(fromHero),
      };
    } else if (fromHero) {
      lastSectionRef.current = { id: 'dashboard', index: -1, fromHero: true };
    }

    if (!fromHistory) {
      const currentState = window.history.state ?? {};
      const nextState = { ...currentState, __emilap: true, __emilapView: id };
      if (activeView === 'dashboard' && id !== 'dashboard') {
        window.history.pushState(nextState, '');
      } else {
        window.history.replaceState(nextState, '');
      }
    }

    busy.current = true;
    const c = curtain.current;
    gsap.timeline({
      onComplete: () => {
        busy.current = false;
        if (queuedView.current) {
          const queued = queuedView.current;
          queuedView.current = null;
          goRef.current?.(queued, { fromHistory: true });
        }
      },
    })
      .set(c, { display: 'block', scaleY: 0, transformOrigin: '50% 100%' })
      .to(c, { scaleY: 1, duration: 0.38, ease: 'power3.inOut' })
      .add(() => {
        setActiveView(id);
      })
      .set(c, { transformOrigin: '50% 0%' })
      .to(c, { scaleY: 0, duration: 0.45, ease: 'power3.inOut', delay: 0.08 })
      .set(c, { display: 'none' });
  };
  goRef.current = go;

  useEffect(() => {
    const currentState = window.history.state ?? {};
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.history.replaceState({ ...currentState, __emilap: true, __emilapView: 'dashboard' }, '');

    const handlePopState = (event) => {
      const target = event.state?.__emilapView ?? 'dashboard';
      if (busy.current) {
        queuedView.current = target;
        return;
      }
      goRef.current?.(target, { fromHistory: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const views = {
    report_lost: <ReportFormView type="lost" />,
    report_found: <ReportFormView type="found" />,
    browse: <BrowseView />,
    matches: <MatchesView />,
    claims: <ClaimsView />,
    admin: <AdminView />,
    settings: <AccountSettingsView />,
  };
  const sectionIndex = navigationItems.findIndex((item) => item.id === activeView);
  const sectionTitle = navigationItems[sectionIndex]?.label ?? 'Section';

  return (
    <AppShell activeView={activeView} navigationItems={navigationItems} onNavigate={go}>
      {activeView === 'dashboard' ? (
        <HomePage
          items={navigationItems}
          onSelect={go}
          restoreSection={lastSectionRef.current}
        />
      ) : (
        <SectionPage title={sectionTitle} sectionIndex={Math.max(0, sectionIndex)}>
          {views[activeView] ?? <EmptyPlaceholder title={sectionTitle} />}
        </SectionPage>
      )}

      <div
        ref={curtain}
        className="page-curtain"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </AppShell>
  );
}
