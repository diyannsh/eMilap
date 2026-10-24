import OrbitImages from '../ui/OrbitImages.jsx';
import './SectionOrbit.css';

export const makeSectionTile = (label, index) => {
  const accent = ['#d8dade', '#aeb1b7', '#8f939b'][index % 3];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2b2d32"/><stop offset="1" stop-color="#101113"/></linearGradient></defs>
    <rect x="2" y="2" width="356" height="356" rx="28" fill="url(#g)" stroke="${accent}" stroke-opacity=".55" stroke-width="3"/>
    <circle cx="180" cy="145" r="72" fill="${accent}" fill-opacity=".12" stroke="${accent}" stroke-opacity=".65" stroke-width="2"/>
    <text x="180" y="170" text-anchor="middle" fill="${accent}" font-family="Arial,sans-serif" font-size="76" font-weight="700">${label.slice(0, 1)}</text>
    <path d="M42 252h276" stroke="${accent}" stroke-opacity=".28"/>
    <text x="180" y="302" text-anchor="middle" fill="#f4f4f5" font-family="Arial,sans-serif" font-size="25" font-weight="600">${label}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export default function SectionOrbit({ items, onSelect, paused = false, freezeItemIndex = -1 }) {
  const orbitItems = items.filter((item) => item.id !== 'dashboard');
  const images = orbitItems.map((item, index) => ({
    src: makeSectionTile(item.label, index),
    alt: `Open ${item.label}`,
  }));

  return (
    <section className="section-orbit-screen" aria-label="Choose a section">
      <p className="section-orbit-eyebrow">CAMPUS LOST &amp; FOUND</p>
      <OrbitImages
        images={images}
        shape="ellipse"
        baseWidth={1400}
        radiusX={500}
        radiusY={190}
        rotation={-5}
        duration={42}
        itemSize={112}
        itemRadius={18}
        depth={0.62}
        hoverScale={1.1}
        hoverSpeed={0.35}
        paused={paused}
        freezeItemIndex={freezeItemIndex}
        clickToFront={false}
        showPath
        pathColor="rgba(216, 218, 222, 0.24)"
        pathWidth={1.5}
        onItemClick={(index, _source, element) => onSelect(orbitItems[index].id, index, element)}
        centerContent={(
          <div className="section-orbit-center">
            <span className="section-orbit-mark">eM</span>
            <h2>eMilap</h2>
            <p>Choose a lost-and-found service</p>
          </div>
        )}
      />
      <p className="section-orbit-hint">Drag to explore | Select a section to continue</p>
    </section>
  );
}
