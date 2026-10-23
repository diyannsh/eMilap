import './MochaFlowerBackground.css';

const SECTIONS = [
  { id: 'report_lost', src: '/images/Report_lost.webp', alt: 'Report Lost' },
  { id: 'report_found', src: '/images/Report_found.webp', alt: 'Report Found' },
  { id: 'browse', src: '/images/Campus_listings.webp', alt: 'Campus Listings' },
  { id: 'matches', src: '/images/Possible_matches.webp', alt: 'Possible Matches' },
  { id: 'claims', src: '/images/Ownership_claims.webp', alt: 'Ownership Claims' },
  { id: 'notifications', src: '/images/Updates.webp', alt: 'Updates' },
  { id: 'admin', src: '/images/Moderation.webp', alt: 'Moderation' },
  { id: 'settings', src: '/images/Account-settings.webp', alt: 'Account Settings' },
];

export default function MochaFlowerBackground({ activeView = 'dashboard' }) {
  const isHome = activeView === 'dashboard';

  return (
    <div className="mocha-flower-bg pointer-events-none" aria-hidden="true">
      {/* Base uniform dark background - single shade across entire screen */}
      <div className="mocha-flower-backdrop" />

      {/* Home Screen: Botanical Flower Artwork seamlessly blended into the dark backdrop */}
      <div className={`mocha-flower-visual-stage ${isHome ? 'is-active' : ''}`}>
        <img
          src="/images/hero-flower.webp"
          alt=""
          className="mocha-flower-img"
          loading="eager"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src.endsWith('.webp')) {
              e.currentTarget.src = '/images/hero-flower.jpg';
            }
          }}
        />
        <div className="mocha-flower-mask-wash" />
      </div>

      {/* Section Pages: Background Photo for each of the 8 sections */}
      {SECTIONS.map((section) => {
        const isActive = activeView === section.id;
        return (
          <div
            key={section.id}
            className={`mocha-section-layer ${isActive ? 'is-active' : ''}`}
          >
            <img
              src={section.src}
              alt=""
              className="mocha-section-img"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src.endsWith('.webp')) {
                  e.currentTarget.src = section.src.replace('.webp', '.jpg');
                }
              }}
            />
            <div className="mocha-section-overlay" />
          </div>
        );
      })}

      {/* Subtle edge vignette */}
      <div className="mocha-flower-vignette" />
    </div>
  );
}
