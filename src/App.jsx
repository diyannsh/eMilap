import { useLayoutEffect, useState } from 'react';
import AdminView from './components/admin/AdminView.jsx';
import BrowseView from './components/browse/BrowseView.jsx';
import ClaimsView from './components/claims/ClaimsView.jsx';
import AppShell from './components/layout/AppShell.jsx';
import SectionOrbit from './components/layout/SectionOrbit.jsx';
import SectionPage from './components/layout/SectionPage.jsx';
import SpatialTransition from './components/layout/SpatialTransition.jsx';
import MatchesView from './components/matches/MatchesView.jsx';
import ReportFormView from './components/reports/ReportFormView.jsx';
import EmptyPlaceholder from './components/ui/EmptyPlaceholder.jsx';
import { navigationItems } from './data/navigation.js';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [transition, setTransition] = useState(null);
  const [phase, setPhase] = useState('idle');

  useLayoutEffect(() => {
    if (phase !== 'opening' && phase !== 'closing') return undefined;
    const { overflow, scrollbarGutter } = document.documentElement.style;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.scrollbarGutter = 'stable';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = overflow;
      document.documentElement.style.scrollbarGutter = scrollbarGutter;
      document.body.style.overflow = bodyOverflow;
    };
  }, [phase]);

  const selectSection = (id, orbitIndex, card) => {
    if (phase !== 'idle') return;
    const section = navigationItems.find((item) => item.id === id);
    if (!section || !card) return;
    setTransition({ section, orbitIndex, card });
    setPhase('opening');
  };

  const navigate = (id) => {
    if (id === 'dashboard') {
      if (phase === 'open') setPhase('closing');
      else if (phase === 'idle' && activeView !== 'dashboard') {
        setActiveView('dashboard');
        window.scrollTo(0, 0);
      }
      return;
    }
    if (phase === 'idle') {
      const section = navigationItems.find((item) => item.id === id);
      if (section) {
        setActiveView(id);
        window.scrollTo(0, 0);
      }
    }
  };

  const showSection = () => {
    if (!transition) return;
    setActiveView(transition.section.id);
  };

  const finishOpen = () => {
    setPhase('open');
  };

  const finishClose = () => {
    setActiveView('dashboard');
    setTransition(null);
    setPhase('idle');
  };

  const views = {
    report_lost: <ReportFormView type="lost" />,
    report_found: <ReportFormView type="found" />,
    browse: <BrowseView />,
    matches: <MatchesView />,
    claims: <ClaimsView />,
    admin: <AdminView />,
  };
  const sectionId = activeView === 'dashboard' ? null : activeView;
  const sectionIndex = navigationItems.findIndex((item) => item.id === sectionId);
  const sectionTitle = navigationItems[sectionIndex]?.label ?? 'Section';

  return (
    <AppShell activeView={activeView} navigationItems={navigationItems} onNavigate={navigate} transitioning={phase !== 'idle'}>
      <div className={phase === 'open' ? 'orbit-scene orbit-scene-hidden' : 'orbit-scene'} aria-hidden={activeView !== 'dashboard'}>
        <SectionOrbit items={navigationItems} onSelect={selectSection} paused={phase !== 'idle'} freezeItemIndex={transition?.orbitIndex ?? -1} />
      </div>
      {sectionId && (
        <div className="section-transition-page" data-transition-page>
          <SectionPage title={sectionTitle} sectionIndex={Math.max(0, sectionIndex)} transitionPending={phase !== 'idle'}>
            {views[sectionId] ?? <EmptyPlaceholder title={sectionTitle} />}
          </SectionPage>
        </div>
      )}
      {transition && (
        <SpatialTransition
          card={transition.card}
          pageReady={activeView === transition.section.id}
          direction={phase === 'closing' ? 'close' : 'open'}
          onCardArrive={showSection}
          onOpenComplete={finishOpen}
          onCloseComplete={finishClose}
        />
      )}
    </AppShell>
  );
}
