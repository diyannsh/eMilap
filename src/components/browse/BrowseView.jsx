import { useEffect, useMemo, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { CAMPUS_ZONES, ITEM_CATEGORIES, useMockStore } from '../../data/mockStore.js';
import { copyShareLink, getRouteUrl } from '../../lib/routes.js';
import {
  ArrowRight,
  Check,
  Filter,
  Info,
  MapPin,
  RotateCcw,
  Search,
  Share2,
  Tag,
  X,
} from 'lucide-react';

export default function BrowseView({ onNavigate, initialItemId }) {
  const { items } = useMockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LOST' | 'FOUND'
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [zoneFilter, setZoneFilter] = useState('All Campus Locations');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFiltersBar, setShowFiltersBar] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState(null);

  // Deep-link: automatically open item when initialItemId is provided in URL
  useEffect(() => {
    if (initialItemId && items.length > 0) {
      const match = items.find((i) => i.id === initialItemId);
      if (match) {
        setSelectedItem(match);
      }
    }
  }, [initialItemId, items]);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    if (typeof window !== 'undefined') {
      const url = getRouteUrl('browse', { itemId: item.id });
      window.history.replaceState(null, '', url);
    }
  };

  const handleCloseItem = () => {
    setSelectedItem(null);
    if (typeof window !== 'undefined') {
      const url = getRouteUrl('browse');
      window.history.replaceState(null, '', url);
    }
  };

  const handleShare = async (e, item) => {
    e?.stopPropagation();
    await copyShareLink('browse', { itemId: item.id });
    setCopiedItemId(item.id);
    setTimeout(() => setCopiedItemId(null), 2200);
  };

  // Filter items reactively
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'All Categories' && item.category !== categoryFilter) {
        return false;
      }
      // Zone filter
      if (zoneFilter !== 'All Campus Locations' && item.location !== zoneFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesColor = item.color?.toLowerCase().includes(query);
        const matchesLocation = item.location?.toLowerCase().includes(query);
        const matchesSpot = item.spot?.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesDesc && !matchesColor && !matchesLocation && !matchesSpot && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, zoneFilter, searchQuery]);

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    categoryFilter !== 'All Categories' ||
    zoneFilter !== 'All Campus Locations' ||
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('All Categories');
    setZoneFilter('All Campus Locations');
  };

  const lostCount = items.filter((i) => i.status === 'LOST').length;
  const foundCount = items.filter((i) => i.status === 'FOUND').length;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* ── Search & Filter Controls Bar ── */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1 bg-[#1A100C]/90 backdrop-blur-xl rounded-xl p-2.5 border border-[#6F4E37]/60 flex items-center px-4 focus-within:border-[#E6E0F0] shadow-xl transition-all">
            <Search className="text-[#E6E0F0]/80 mr-3 shrink-0" size={19} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search listings"
              placeholder="Search by keyword, item, color, or location..."
              className="bg-transparent border-none outline-none text-[#FAF9F8] placeholder-[#E5E4E2]/40 w-full text-sm md:text-base"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#E5E4E2]/60 hover:text-[#FAF9F8] p-1 ml-2 transition"
                aria-label="Clear search text"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersBar((prev) => !prev)}
            className={`px-4 md:px-5 flex items-center gap-2 rounded-xl text-sm font-medium transition shadow-xl border ${
              showFiltersBar || hasActiveFilters
                ? 'bg-[#6F4E37] text-[#FAF9F8] border-[#E6E0F0]/50'
                : 'bg-[#241611] text-[#E5E4E2] border-[#6F4E37]/60 hover:bg-[#341F17]'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#E6E0F0]" />
            )}
          </button>
        </div>

        {/* ── Status Pills & Quick Filter Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#140C08]/80 border border-[#6F4E37]/45 p-3 rounded-xl backdrop-blur-md">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0E0805]/70 p-1 rounded-lg border border-[#6F4E37]/35">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
                statusFilter === 'ALL'
                  ? 'bg-[#6F4E37] text-[#FAF9F8] shadow'
                  : 'text-[#E5E4E2]/70 hover:text-[#FAF9F8]'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FOUND')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
                statusFilter === 'FOUND'
                  ? 'bg-[#C68B59] text-[#160D0A] shadow'
                  : 'text-[#E5E4E2]/70 hover:text-[#FAF9F8]'
              }`}
            >
              Found ({foundCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOST')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition ${
                statusFilter === 'LOST'
                  ? 'bg-[#8C5E43] text-[#FAF9F8] shadow'
                  : 'text-[#E5E4E2]/70 hover:text-[#FAF9F8]'
              }`}
            >
              Lost ({lostCount})
            </button>
          </div>

          {/* Location Dropdown */}
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#C68B59] hidden sm:inline" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              aria-label="Filter by campus location"
              className="bg-[#1C120D] text-[#E5E4E2] text-xs font-medium border border-[#6F4E37]/60 rounded-lg px-3 py-2 outline-none focus:border-[#E6E0F0] cursor-pointer"
            >
              {CAMPUS_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Expandable Category Filter Strip ── */}
        {(showFiltersBar || categoryFilter !== 'All Categories') && (
          <div className="p-3 bg-[#180E0A]/90 border border-[#6F4E37]/50 rounded-xl space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-[#E6E0F0]/80 px-1 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Tag size={13} /> Filter by Category
              </span>
              {categoryFilter !== 'All Categories' && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter('All Categories')}
                  className="text-xs text-[#C68B59] hover:underline"
                >
                  Clear Category
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ITEM_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    categoryFilter === cat
                      ? 'bg-[#E6E0F0] text-[#160D0A] font-bold border-[#E6E0F0]'
                      : 'bg-[#100805] text-[#E5E4E2]/80 border-[#6F4E37]/40 hover:border-[#E6E0F0]/50 hover:text-[#FAF9F8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Filter Badges Strip ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-[#E5E4E2]/60">Active filters:</span>
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-[#2E1C15] text-[#E5E4E2] border border-[#6F4E37]/60">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('ALL')} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {categoryFilter !== 'All Categories' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-[#2E1C15] text-[#E5E4E2] border border-[#6F4E37]/60">
                {categoryFilter}
                <button type="button" onClick={() => setCategoryFilter('All Categories')} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {zoneFilter !== 'All Campus Locations' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-[#2E1C15] text-[#E5E4E2] border border-[#6F4E37]/60">
                {zoneFilter}
                <button type="button" onClick={() => setZoneFilter('All Campus Locations')} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-[#2E1C15] text-[#E5E4E2] border border-[#6F4E37]/60">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs text-[#C68B59] hover:text-[#E0AA6F] hover:underline ml-1"
            >
              <RotateCcw size={12} /> Reset all
            </button>
          </div>
        )}
      </div>

      {/* ── Listings Grid ── */}
      <FloatingPanel
        title={`Campus Listings (${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'items'})`}
      >
        <p className="mb-5 text-sm text-[#E5E4E2]/75">
          Real-time reports from campus desks, lecture halls, and student submissions. Click any card for details or to share.
        </p>

        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-xl bg-[#140C08]/80 border border-[#6F4E37]/45 flex flex-col items-center justify-center gap-3">
            <Info size={36} className="text-[#C68B59] opacity-80" />
            <h4 className="text-lg font-semibold text-[#FAF9F8]">No matching listings found</h4>
            <p className="text-sm text-[#E5E4E2]/70 max-w-md">
              We couldn&apos;t find any lost or found items matching your current filters. Try searching with fewer keywords or clearing filters.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-lg text-xs font-semibold transition"
              >
                Reset All Filters
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('report_lost')}
                  className="px-4 py-2 bg-[#231713] hover:bg-[#341F17] text-[#E5E4E2] border border-[#6F4E37]/60 rounded-lg text-xs font-medium transition"
                >
                  File a Lost Report
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isFound = item.status === 'FOUND';
              const isCopied = copiedItemId === item.id;
              return (
                <article
                  key={item.id}
                  onClick={() => handleOpenItem(item)}
                  className="p-5 rounded-xl bg-[#140C08]/80 border border-[#6F4E37]/50 hover:border-[#E6E0F0]/60 flex flex-col gap-3 transition-all duration-200 shadow-lg cursor-pointer hover:shadow-2xl hover:-translate-y-0.5 group"
                >
                  {/* Status, Category & Share Button */}
                  <div className="flex justify-between items-center gap-2">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded font-semibold tracking-wider ${
                        isFound
                          ? 'bg-[#C68B59]/20 text-[#C68B59] border border-[#C68B59]/40'
                          : 'bg-[#6F4E37]/35 text-[#E6E0F0] border border-[#6F4E37]/60'
                      }`}
                    >
                      {item.status} {item.isSample ? '· SAMPLE' : '· LIVE'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, item)}
                        className={`p-1.5 rounded-lg border transition ${
                          isCopied
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                            : 'text-[#E5E4E2]/50 hover:text-[#FAF9F8] border-transparent hover:border-[#6F4E37]/60 hover:bg-[#231713]'
                        }`}
                        title="Copy direct link to this listing"
                        aria-label={`Copy link for ${item.title}`}
                      >
                        {isCopied ? <Check size={13} /> : <Share2 size={13} />}
                      </button>
                      <span className="text-[11px] text-[#E5E4E2]/60 font-medium">
                        {item.date || 'Recent'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Category pill */}
                  <div>
                    <h4 className="text-[#FAF9F8] font-semibold text-base group-hover:text-[#FAF9F8] transition leading-snug">
                      {item.title}
                    </h4>
                    <span className="inline-block mt-1 text-[11px] text-[#C68B59]/90 font-medium">
                      {item.category} {item.color ? `• ${item.color}` : ''}
                    </span>
                  </div>

                  {/* Description preview */}
                  <p className="text-[#E5E4E2]/80 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Location & Action */}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-3 text-xs border-t border-[#6F4E37]/30">
                    <span className="flex items-center gap-1.5 text-[#E6E0F0]/90 truncate">
                      <MapPin size={13} className="text-[#C68B59] shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </span>
                    <span className="text-[#E6E0F0] text-xs font-semibold group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </FloatingPanel>

      {/* ── Item Detail Modal / Overlay with Direct Link Support ── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-[#0E0805]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={handleCloseItem}
        >
          <div
            className="w-full max-w-lg bg-[#1B110C] border border-[#6F4E37] rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#6F4E37]/30 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded font-bold tracking-wider ${
                    selectedItem.status === 'FOUND'
                      ? 'bg-[#C68B59]/20 text-[#C68B59] border border-[#C68B59]/40'
                      : 'bg-[#6F4E37]/40 text-[#E6E0F0] border border-[#6F4E37]/60'
                  }`}
                >
                  {selectedItem.status} ITEM
                </span>
                <span className="text-xs text-[#E5E4E2]/60">ID: {selectedItem.id}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Share Link Button */}
                <button
                  type="button"
                  onClick={(e) => handleShare(e, selectedItem)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    copiedItemId === selectedItem.id
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#241611] text-[#E5E4E2] border-[#6F4E37]/60 hover:bg-[#341F18]'
                  }`}
                >
                  {copiedItemId === selectedItem.id ? (
                    <>
                      <Check size={13} /> Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 size={13} /> Share Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCloseItem}
                  className="text-[#E5E4E2]/60 hover:text-[#FAF9F8] p-1.5 rounded-lg border border-[#6F4E37]/40 hover:bg-[#281610] transition"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#FAF9F8]">{selectedItem.title}</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#120906] p-3 rounded-lg border border-[#6F4E37]/35">
                <span className="text-[#E5E4E2]/60 block mb-0.5">Category</span>
                <span className="text-[#FAF9F8] font-semibold">{selectedItem.category}</span>
              </div>
              <div className="bg-[#120906] p-3 rounded-lg border border-[#6F4E37]/35">
                <span className="text-[#E5E4E2]/60 block mb-0.5">Color</span>
                <span className="text-[#FAF9F8] font-semibold">{selectedItem.color || 'Not specified'}</span>
              </div>
              <div className="bg-[#120906] p-3 rounded-lg border border-[#6F4E37]/35 col-span-2">
                <span className="text-[#E5E4E2]/60 block mb-0.5">Campus Location & Spot</span>
                <span className="text-[#FAF9F8] font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-[#C68B59]" /> {selectedItem.location}
                  {selectedItem.spot ? ` — ${selectedItem.spot}` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#E6E0F0] uppercase tracking-wider">
                Full Description
              </span>
              <p className="text-sm text-[#E5E4E2]/90 bg-[#120906] p-3 rounded-lg border border-[#6F4E37]/35 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#C68B59] uppercase tracking-wider">
                Holding Campus Location / Contact
              </span>
              <p className="text-xs text-[#E5E4E2]/80 bg-[#120906] p-3 rounded-lg border border-[#6F4E37]/35">
                {selectedItem.contact || 'Campus Lost & Found Administration'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {selectedItem.status === 'FOUND' ? (
                <button
                  type="button"
                  onClick={() => {
                    handleCloseItem();
                    onNavigate?.('claims');
                  }}
                  className="flex-1 py-3 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-xl font-semibold text-sm transition shadow-lg border border-[#E5E4E2]/20 flex items-center justify-center gap-1.5"
                >
                  Start Ownership Claim <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleCloseItem();
                    onNavigate?.('report_found');
                  }}
                  className="flex-1 py-3 bg-[#C68B59] hover:bg-[#D99A62] text-[#160D0A] rounded-xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  I Found This Item <ArrowRight size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseItem}
                className="py-3 px-5 bg-[#241611] hover:bg-[#331F18] text-[#E5E4E2] rounded-xl text-sm font-medium border border-[#6F4E37]/50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
