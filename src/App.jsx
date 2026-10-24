import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AdminView from './components/admin/AdminView.jsx';
import BrowseView from './components/browse/BrowseView.jsx';
import ClaimsView from './components/claims/ClaimsView.jsx';
import AppShell from './components/layout/AppShell.jsx';
import HomePage from './components/layout/HomePage.jsx';
import SectionPage from './components/layout/SectionPage.jsx';
import MatchesView from './components/matches/MatchesView.jsx';
import NotificationsView from './components/notifications/NotificationsView.jsx';
import ReportFormView from './components/reports/ReportFormView.jsx';
import EmptyPlaceholder from './components/ui/EmptyPlaceholder.jsx';
import { navigationItems } from './data/navigation.js';
import AccountSettingsView from './components/account/AccountSettingsView.jsx';
import LostFoundChatbot from './components/chat/LostFoundChatbot.jsx';
import { getRouteUrl, parseCurrentRoute } from './lib/routes.js';
import { AuthProvider } from './context/AuthContext.jsx';

function AppContent() {
  const initialRoute = parseCurrentRoute();
  const [activeView, setActiveView] = useState(() => initialRoute.view);
  const [routeParams, setRouteParams] = useState(() => initialRoute.params);
  const [inSectionsSlider, setInSectionsSlider] = useState(false);
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
    const { fromHistory = false, index, fromHero = false, fromFooter = false, params = {} } = options;

    if (busy.current) return;
    if (id === activeView && !params.itemId && !params.claimId) return;
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

    const nextUrl = getRouteUrl(id, params);

    if (!fromHistory) {
      const currentState = window.history.state ?? {};
      const nextState = { ...currentState, __emilap: true, __emilapView: id, __emilapParams: params };
      if (activeView === 'dashboard' && id !== 'dashboard') {
        window.history.pushState(nextState, '', nextUrl);
      } else {
        window.history.pushState(nextState, '', nextUrl);
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
          goRef.current?.(queued.id, { fromHistory: true, params: queued.params });
        }
      },
    })
      .set(c, { display: 'block', scaleY: 0, transformOrigin: '50% 100%' })
      .to(c, { scaleY: 1, duration: 0.38, ease: 'power3.inOut' })
      .add(() => {
        setActiveView(id);
        setRouteParams(params);
      })
      .set(c, { transformOrigin: '50% 0%' })
      .to(c, { scaleY: 0, duration: 0.45, ease: 'power3.inOut', delay: 0.08 })
      .set(c, { display: 'none' });
  };
  goRef.current = go;

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const currentRoute = parseCurrentRoute();
    const currentState = window.history.state ?? {};
    const initialUrl = getRouteUrl(currentRoute.view, currentRoute.params);

    window.history.replaceState(
      { ...currentState, __emilap: true, __emilapView: currentRoute.view, __emilapParams: currentRoute.params },
      '',
      initialUrl
    );

    const handleRouteSync = (event) => {
      const parsed = parseCurrentRoute();
      const targetView = event?.state?.__emilapView ?? parsed.view ?? 'dashboard';
      const targetParams = event?.state?.__emilapParams ?? parsed.params ?? {};

      if (busy.current) {
        queuedView.current = { id: targetView, params: targetParams };
        return;
      }
      goRef.current?.(targetView, { fromHistory: true, params: targetParams });
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);

    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const views = {
    report_lost: <ReportFormView type="lost" onNavigate={go} />,
    report_found: <ReportFormView type="found" onNavigate={go} />,
    browse: <BrowseView onNavigate={go} initialItemId={routeParams.itemId} />,
    matches: <MatchesView onNavigate={go} />,
    claims: <ClaimsView onNavigate={go} initialClaimId={routeParams.claimId} />,
    notifications: <NotificationsView onNavigate={go} />,
    admin: <AdminView onNavigate={go} />,
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
          onSliderChange={setInSectionsSlider}
        />
      ) : (
        <SectionPage title={sectionTitle} sectionIndex={Math.max(0, sectionIndex)}>
          {views[activeView] ?? <EmptyPlaceholder title={sectionTitle} />}
        </SectionPage>
      )}

      {/* Campus Lost & Found AI Chatbot - present on Main Interface Home Screen and all Section Detail Pages; hidden when exploring sections slider */}
      <LostFoundChatbot
        visible={activeView !== 'dashboard' || !inSectionsSlider}
        onNavigate={go}
      />

      <div
        ref={curtain}
        className="page-curtain"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
