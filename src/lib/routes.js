/**
 * eMilap URL Routing & Deep-Linking Utility
 * Maps internal views to shareable URL hashes and query parameters.
 * Enables direct bookmarking, browser back/forward, and item sharing.
 */

export const VIEW_TO_HASH = {
  dashboard: '#overview',
  report_lost: '#report-lost',
  report_found: '#report-found',
  browse: '#browse',
  matches: '#matches',
  claims: '#claims',
  notifications: '#updates',
  admin: '#moderation',
  settings: '#settings',
};

export const HASH_TO_VIEW = {
  '': 'dashboard',
  '#': 'dashboard',
  '#home': 'dashboard',
  '#overview': 'dashboard',
  '#dashboard': 'dashboard',
  '#report-lost': 'report_lost',
  '#report_lost': 'report_lost',
  '#report-found': 'report_found',
  '#report_found': 'report_found',
  '#browse': 'browse',
  '#listings': 'browse',
  '#campus-listings': 'browse',
  '#matches': 'matches',
  '#possible-matches': 'matches',
  '#claims': 'claims',
  '#ownership-claims': 'claims',
  '#notifications': 'notifications',
  '#updates': 'notifications',
  '#admin': 'admin',
  '#moderation': 'admin',
  '#settings': 'settings',
  '#account': 'settings',
};

/**
 * Parses the current window location (hash or pathname) into view and query params.
 */
export function parseCurrentRoute() {
  if (typeof window === 'undefined') {
    return { view: 'dashboard', params: {} };
  }

  const hash = window.location.hash || '';
  // Split hash into path and query string, e.g. #browse?item=item-1
  const [baseHash, queryString] = hash.split('?');
  const normalizedHash = baseHash.replace(/^#\/?/, '#').toLowerCase();

  let view = HASH_TO_VIEW[normalizedHash];

  // Fallback: check pathname if someone directly entered /browse or /report-lost
  if (!view) {
    const pathname = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (pathname && HASH_TO_VIEW[`#${pathname}`]) {
      view = HASH_TO_VIEW[`#${pathname}`];
    }
  }

  const params = new URLSearchParams(queryString || '');
  const itemId = params.get('item') || params.get('id') || null;
  const claimId = params.get('claim') || null;

  return {
    view: view || 'dashboard',
    params: {
      itemId,
      claimId,
    },
  };
}

/**
 * Builds the URL hash string for a given view and optional params.
 */
export function getRouteUrl(viewId, params = {}) {
  const baseHash = VIEW_TO_HASH[viewId] || '#overview';
  const search = new URLSearchParams();

  if (params.itemId) search.set('item', params.itemId);
  if (params.claimId) search.set('claim', params.claimId);

  const searchStr = search.toString();
  return searchStr ? `${baseHash}?${searchStr}` : baseHash;
}

/**
 * Copies a fully qualified shareable link to the clipboard.
 */
export async function copyShareLink(viewId, params = {}) {
  const hash = getRouteUrl(viewId, params);
  const fullUrl = `${window.location.origin}${window.location.pathname}${hash}`;

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(fullUrl);
  }
  return fullUrl;
}

