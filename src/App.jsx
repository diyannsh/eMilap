import { useRef, useState } from 'react';
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
  const [backToSections, setBackToSections] = useState(false);
  const curtain = useRef(null);
  const busy = useRef(false);

  // Page change: a curtain wipes up over the screen, the view swaps underneath, then it wipes away.
  const go = (id) => {
    if (busy.current || id === activeView) return;
    if (id !== 'dashboard' && !navigationItems.some((item) => item.id === id)) return;
    busy.current = true;
    const c = curtain.current;
    gsap.timeline({ onComplete: () => { busy.current = false; } })
      .set(c, { display: 'block', scaleY: 0, transformOrigin: '50% 100%' })
      .to(c, { scaleY: 1, duration: 0.38, ease: 'power3.inOut' })
      .add(() => {
        setBackToSections(id === 'dashboard');
        setActiveView(id);
        window.scrollTo(0, 0);
      })
      .set(c, { transformOrigin: '50% 0%' })
      .to(c, { scaleY: 0, duration: 0.45, ease: 'power3.inOut', delay: 0.1 })
      .set(c, { display: 'none' });
  };

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
        <HomePage items={navigationItems} onSelect={go} startAtSections={backToSections} />
      ) : (
        <SectionPage title={sectionTitle} sectionIndex={Math.max(0, sectionIndex)}>
          {views[activeView] ?? <EmptyPlaceholder title={sectionTitle} />}
        </SectionPage>
      )}
      <div ref={curtain} className="page-curtain" aria-hidden="true" />
    </AppShell>
  );
}
