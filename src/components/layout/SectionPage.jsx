import './SectionPage.css';

const sectionDescriptions = {
  Overview: 'Start a report, browse campus listings, or check for a possible match.',
  'Report Lost': 'Describe the item you lost and where you last remember having it.',
  'Report Found': 'Share where you found an item so its owner can identify it.',
  'Campus Listings': 'Browse example lost-and-found reports from around campus.',
  'Possible Matches': 'Review reports with details that may match an item you reported.',
  'Ownership Claims': 'Review the private details used to confirm the owner of an item.',
  Updates: 'Find updates related to your lost-and-found reports.',
  Moderation: 'Review reports and ownership claims that may need attention.',
  'Account Settings': 'Manage your eMilap account preferences.',
};

export default function SectionPage({ title, children, transitionPending = false }) {
  return (
    <div className="section-page" data-transition-content={transitionPending ? '' : undefined}>
      <div className="section-page-content">
        <div className="section-page-heading">
          <p>Campus Lost &amp; Found</p>
          <h1>{title}</h1>
          <span>{sectionDescriptions[title] ?? 'Use eMilap to report, find, and return items on campus.'}</span>
        </div>
        <div className="section-page-panels">{children}</div>
      </div>
    </div>
  );
}
