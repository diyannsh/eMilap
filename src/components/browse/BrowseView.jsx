import { useEffect, useMemo, useRef, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { CAMPUS_ZONES, ITEM_CATEGORIES, mockStore, useMockStore } from '../../data/mockStore.js';
import { copyShareLink, getRouteUrl } from '../../lib/routes.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import {
  ArrowRight,
  Camera,
  Check,
  Edit3,
  Filter,
  Image as ImageIcon,
  ImagePlus,
  Info,
  Lock,
  MapPin,
  RotateCcw,
  Search,
  Share2,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

export default function BrowseView({ onNavigate, initialItemId }) {
  const { user } = useAuth();
  const { items: mockItems } = useMockStore();

  const [backendReports, setBackendReports] = useState([]);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LOST' | 'FOUND'
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [zoneFilter, setZoneFilter] = useState('All Campus Locations');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFiltersBar, setShowFiltersBar] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState(null);

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimEvidenceFile, setClaimEvidenceFile] = useState(null);
  const [claimEvidencePreview, setClaimEvidencePreview] = useState('');
  const [claimStatusMsg, setClaimStatusMsg] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const evidenceInputRef = useRef(null);

  // Edit report modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Electronics');
  const [editColor, setEditColor] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch backend reports
  const fetchBackendReports = async () => {
    setLoadingBackend(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.type = statusFilter;
      if (categoryFilter !== 'All Categories') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.reports.list(params);
      if (Array.isArray(res?.data)) {
        setBackendReports(res.data);
      }
    } catch {
      // Offline or unauthenticated; fall back gracefully to local store
      setBackendReports([]);
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    fetchBackendReports();
  }, [statusFilter, categoryFilter]);

  // Combined item list: Normalize backend reports + mockItems (avoid duplicates by ID)
  const allItems = useMemo(() => {
    const normalizedBackend = backendReports.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.publicDescription || r.description || '',
      category: r.category || 'Other',
      color: r.color || '',
      brand: r.brand || '',
      location: r.approximateLocation || 'Campus',
      spot: '',
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
      status: r.reportType || r.status || 'LOST',
      contact: r.reporter ? `${r.reporter.displayName || r.reporter.email}` : 'Campus Lost & Found Desk',
      isBackend: true,
      rawBackend: r,
    }));

    const backendIds = new Set(normalizedBackend.map((b) => b.id));
    const uniqueMocks = mockItems.filter((m) => !backendIds.has(m.id));

    return [...normalizedBackend, ...uniqueMocks];
  }, [backendReports, mockItems]);

  // Deep-link: automatically open item when initialItemId is provided in URL
  useEffect(() => {
    if (initialItemId && allItems.length > 0) {
      const match = allItems.find((i) => i.id === initialItemId);
      if (match) {
        setSelectedItem(match);
      }
    }
  }, [initialItemId, allItems]);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    if (window.history.pushState) {
      window.history.replaceState(null, '', getRouteUrl('browse', { itemId: item.id }));
    }
  };

  const handleCloseItem = () => {
    setSelectedItem(null);
    if (window.history.pushState) {
      window.history.replaceState(null, '', getRouteUrl('browse'));
    }
  };

  const handleShare = async (e, item) => {
    e.stopPropagation();
    await copyShareLink('browse', { itemId: item.id });
    setCopiedItemId(item.id);
    setTimeout(() => {
      setCopiedItemId(null);
    }, 2000);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('All Categories');
    setZoneFilter('All Campus Locations');
  };

  // Filter items locally based on current active query, category, zone, and status
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.color?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'ALL' || item.status?.toUpperCase() === statusFilter.toUpperCase();

      const matchesCategory =
        categoryFilter === 'All Categories' || item.category === categoryFilter;

      const matchesZone =
        zoneFilter === 'All Campus Locations' ||
        item.location?.toLowerCase().includes(zoneFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCategory && matchesZone;
    });
  }, [allItems, searchQuery, statusFilter, categoryFilter, zoneFilter]);

  const counts = useMemo(() => {
    return {
      all: allItems.length,
      lost: allItems.filter((i) => i.status === 'LOST').length,
      found: allItems.filter((i) => i.status === 'FOUND').length,
    };
  }, [allItems]);

  // Evidence handler
  const handleSelectEvidence = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo evidence must be under 5MB');
      return;
    }
    setClaimEvidenceFile(file);
    setClaimEvidencePreview(URL.createObjectURL(file));
  };

  const clearEvidence = () => {
    setClaimEvidenceFile(null);
    if (claimEvidencePreview) URL.revokeObjectURL(claimEvidencePreview);
    setClaimEvidencePreview('');
    if (evidenceInputRef.current) evidenceInputRef.current.value = '';
  };

  // Submit claim
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimMessage.trim() || !selectedItem) return;
    setClaimLoading(true);
    setClaimStatusMsg('');

    try {
      let evidenceObjectKey = undefined;
      if (claimEvidenceFile) {
        try {
          const uploadRes = await api.uploads.uploadClaimEvidence(claimEvidenceFile);
          evidenceObjectKey = uploadRes?.data?.objectKey;
        } catch (uploadErr) {
          console.warn('Evidence upload failed:', uploadErr);
        }
      }

      if (selectedItem.isBackend && user) {
        await api.claims.create({
          reportId: selectedItem.id,
          message: claimMessage.trim(),
          evidenceObjectKey,
        });
      } else {
        // Fallback local claim
        mockStore.claims.push({
          id: `CLM-${Date.now()}`,
          reportId: selectedItem.id,
          itemTitle: selectedItem.title,
          category: selectedItem.category,
          location: selectedItem.location,
          status: 'PENDING',
          message: claimMessage.trim(),
          createdAt: new Date().toISOString(),
        });
      }

      setClaimStatusMsg('Claim submitted! Campus staff will review your ownership details.');
      setTimeout(() => {
        setClaimModalOpen(false);
        setClaimStatusMsg('');
        clearEvidence();
      }, 1800);
    } catch (err) {
      setClaimStatusMsg(err.message || 'Failed to submit claim. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  // Edit Report Handlers
  const openEditModal = (item) => {
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditCategory(item.category || 'Electronics');
    setEditColor(item.color || '');
    setEditBrand(item.brand || '');
    setEditLocation(item.location || '');
    setEditError('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setEditLoading(true);
    setEditError('');
    try {
      if (selectedItem.isBackend) {
        const updated = await api.reports.update(selectedItem.id, {
          title: editTitle.trim(),
          publicDescription: editDescription.trim(),
          category: editCategory,
          color: editColor.trim() || undefined,
          brand: editBrand.trim() || undefined,
          approximateLocation: editLocation.trim() || undefined,
        });
        setSelectedItem((curr) => (curr ? { ...curr, ...updated.data } : null));
        fetchBackendReports();
      } else {
        mockStore.updateItem(selectedItem.id, {
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: editCategory,
          color: editColor.trim(),
          location: editLocation.trim(),
        });
        setSelectedItem((curr) =>
          curr
            ? {
                ...curr,
                title: editTitle.trim(),
                description: editDescription.trim(),
                category: editCategory,
                color: editColor.trim(),
                location: editLocation.trim(),
              }
            : null
        );
      }
      setEditModalOpen(false);
    } catch (err) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseReport = async (itemId) => {
    if (!window.confirm('Are you sure you want to mark this item as resolved/closed?')) return;
    try {
      if (selectedItem?.isBackend) {
        await api.reports.close(itemId);
        fetchBackendReports();
      }
      setSelectedItem(null);
    } catch (err) {
      alert(err.message || 'Failed to close report');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col space-y-6">
      <FloatingPanel title="Campus Lost &amp; Found Directory">
        {/* ── Top Controls: Search & Tabs ── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input Bar */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E5E4E2]/50 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lost or found items by name, color, brand, or spot..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#6F4E37]/50 bg-[#160D0A]/70 text-sm text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E5E4E2]/50 hover:text-[#FAF9F8]"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFiltersBar((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                showFiltersBar || categoryFilter !== 'All Categories' || zoneFilter !== 'All Campus Locations'
                  ? 'bg-[#6F4E37] text-[#FAF9F8] border-[#E6E0F0]/30 shadow-md'
                  : 'bg-[#180E0A] text-[#E5E4E2] border-[#6F4E37]/50 hover:bg-[#25150F]'
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              {(categoryFilter !== 'All Categories' || zoneFilter !== 'All Campus Locations') && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>

          {/* Status Tabs: All, Lost, Found */}
          <div className="flex items-center gap-2 border-b border-[#6F4E37]/30 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-[#6F4E37] text-[#FAF9F8] shadow'
                  : 'text-[#E5E4E2]/70 hover:text-[#FAF9F8] hover:bg-[#1C100B]'
              }`}
            >
              All Items ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOST')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'LOST'
                  ? 'bg-[#6F4E37] text-[#FAF9F8] shadow'
                  : 'text-[#E5E4E2]/70 hover:text-[#FAF9F8] hover:bg-[#1C100B]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              Lost ({counts.lost})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FOUND')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'FOUND'
                  ? 'bg-[#C68B59] text-[#160D0A] shadow font-bold'
                  : 'text-[#E5E4E2]/70 hover:text-[#FAF9F8] hover:bg-[#1C100B]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Found ({counts.found})
            </button>
          </div>

          {/* ── Collapsible Filters Bar: Categories & Zones ── */}
          {showFiltersBar && (
            <div className="p-4 rounded-xl bg-[#140C08]/80 border border-[#6F4E37]/50 space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Campus Zone Select */}
                <div>
                  <label className="block mb-1 font-semibold text-[#E6E0F0] flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#C68B59]" /> Campus Zone
                  </label>
                  <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#6F4E37]/50 bg-[#1D110C] text-[#FAF9F8] focus:border-[#E6E0F0] focus:outline-none"
                  >
                    {CAMPUS_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters Shortcut */}
                <div className="flex items-end justify-start md:justify-end">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#E5E4E2]/80 hover:text-[#FAF9F8] hover:bg-[#20130E] border border-transparent hover:border-[#6F4E37]/40 flex items-center gap-1.5 transition"
                  >
                    <RotateCcw size={13} /> Reset All Filters
                  </button>
                </div>
              </div>

              {/* Category Pills Bar */}
              <div>
                <label className="block mb-1.5 font-semibold text-[#E6E0F0] text-xs flex items-center gap-1.5">
                  <Tag size={13} className="text-[#C68B59]" /> Item Categories
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ITEM_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-full text-xs transition ${
                        categoryFilter === cat
                          ? 'bg-[#C68B59] text-[#160D0A] font-bold shadow-sm'
                          : 'bg-[#1D110C] text-[#E5E4E2]/80 hover:text-[#FAF9F8] border border-[#6F4E37]/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Results Info Bar ── */}
        <div className="mt-4 mb-2 flex items-center justify-between text-xs text-[#E5E4E2]/60 px-1">
          <span>
            Showing <strong className="text-[#FAF9F8]">{filteredItems.length}</strong> listings
          </span>
          {loadingBackend && <span className="text-[#C68B59]">Syncing campus registry...</span>}
        </div>

        {/* ── Item Grid / Cards ── */}
        {filteredItems.length === 0 ? (
          <div className="my-10 text-center p-8 rounded-2xl bg-[#140C08]/60 border border-[#6F4E37]/40 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#6F4E37]/20 border border-[#6F4E37]/40 flex items-center justify-center text-[#C68B59]">
              <Search size={22} />
            </div>
            <h4 className="text-base font-semibold text-[#FAF9F8]">No listings found</h4>
            <p className="text-xs text-[#E5E4E2]/70 max-w-sm mx-auto">
              We couldn&apos;t find any lost or found items matching your search criteria. Try loosening your filters or search keywords.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] text-xs font-semibold rounded-lg transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {filteredItems.map((item) => {
              const isFound = item.status === 'FOUND';
              return (
                <article
                  key={item.id}
                  onClick={() => handleOpenItem(item)}
                  className="group cursor-pointer rounded-xl bg-[#160D0A]/75 hover:bg-[#1D110C] border border-[#6F4E37]/45 hover:border-[#6F4E37] p-4 transition-all duration-200 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      isFound ? 'bg-[#C68B59]' : 'bg-[#6F4E37]'
                    }`}
                  />

                  {/* Header: Status badge, ID, Share link button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isFound
                          ? 'bg-[#C68B59]/20 text-[#C68B59] border border-[#C68B59]/40'
                          : 'bg-[#6F4E37]/35 text-[#E6E0F0] border border-[#6F4E37]/50'
                      }`}
                    >
                      {item.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#E5E4E2]/50 font-mono">
                        {item.date}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, item)}
                        title="Copy direct share link to item"
                        className={`p-1 rounded hover:bg-[#281610] text-[#E5E4E2]/60 hover:text-[#FAF9F8] transition ${
                          copiedItemId === item.id ? 'text-emerald-400' : ''
                        }`}
                      >
                        {copiedItemId === item.id ? <Check size={13} /> : <Share2 size={13} />}
                      </button>
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
                <span className="text-xs text-[#E5E4E2]/60 font-mono">
                  ID: #{String(selectedItem.id).slice(-6)}
                </span>
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

            {selectedItem.rawBackend?.images?.[0]?.objectKey && (
              <div className="w-full h-48 rounded-xl overflow-hidden bg-[#120906] border border-[#6F4E37]/40">
                <img
                  src={`/api/v1/uploads/reports/${selectedItem.rawBackend.images[0].objectKey}`}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

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
                <span className="text-[#E5E4E2]/60 block mb-0.5">Campus Location &amp; Spot</span>
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

            {/* Moderator / Creator Action Buttons */}
            {user && (user.id === selectedItem.rawBackend?.reporterId || user.role === 'MODERATOR' || user.role === 'ADMIN') && (
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedItem)}
                  className="px-3 py-1.5 rounded-lg border border-[#6F4E37]/60 text-[#E6E0F0] hover:bg-[#281610] text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Edit3 size={13} /> Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseReport(selectedItem.id)}
                  className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-950/40 text-xs font-semibold transition"
                >
                  Close Listing
                </button>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {selectedItem.status === 'FOUND' ? (
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(true)}
                  className="flex-1 py-3 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-xl font-semibold text-sm transition shadow-lg border border-[#E5E4E2]/20 flex items-center justify-center gap-1.5"
                >
                  <Lock size={15} /> Start Ownership Claim
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

      {/* ── Claim Submission Modal ── */}
      {claimModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[#6F4E37] bg-[#1B110C] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setClaimModalOpen(false);
                setClaimStatusMsg('');
                clearEvidence();
              }}
              className="absolute top-4 right-4 p-2 text-[#E5E4E2]/60 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-[#FAF9F8] flex items-center gap-2">
              <Lock size={18} className="text-[#C68B59]" /> Confirm Item Ownership
            </h3>
            <p className="text-xs text-[#E5E4E2]/70 mt-1">
              Claiming: <strong className="text-[#FAF9F8]">{selectedItem.title}</strong>
            </p>

            <form onSubmit={handleSubmitClaim} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#E5E4E2] mb-1">
                  Private verification details *
                </label>
                <textarea
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                  placeholder="Describe specific unique details only the true owner would know (e.g. serial numbers, stickers, specific contents, distinctive marks)..."
                  required
                  rows={4}
                  className="w-full rounded-xl border border-[#6F4E37]/60 bg-[#120906] p-3 text-xs text-[#FAF9F8] outline-none focus:border-[#E6E0F0]"
                />
                <p className="text-[10px] text-[#E5E4E2]/50 mt-1">
                  Never made public. Only visible to verified campus staff during review.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#E5E4E2] mb-1">
                  Private Photographic Evidence (Optional)
                </label>
                {claimEvidencePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#6F4E37]/50 bg-[#120906] h-28 max-w-xs">
                    <img src={claimEvidencePreview} alt="Evidence preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={clearEvidence}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded text-[#FAF9F8] hover:text-white"
                      aria-label="Remove evidence"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => evidenceInputRef.current?.click()}
                    className="w-full border border-dashed border-[#6F4E37]/60 rounded-xl p-3 text-center text-xs text-[#E5E4E2]/70 hover:border-[#E6E0F0] hover:text-[#FAF9F8] transition flex items-center justify-center gap-1.5"
                  >
                    <ImagePlus size={15} /> Attach evidence photo (receipt, serial, pre-loss photo)
                  </button>
                )}
                <input
                  ref={evidenceInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => handleSelectEvidence(e.target.files?.[0])}
                />
                <p className="text-[10px] text-[#E5E4E2]/50 mt-1">
                  JPEG, PNG, or WEBP up to 5MB. Stored securely and only viewable by authorized staff.
                </p>
              </div>

              {claimStatusMsg && (
                <p className="text-xs p-2.5 rounded-lg bg-[#6F4E37]/20 border border-[#6F4E37]/50 text-[#FAF9F8] font-medium">
                  {claimStatusMsg}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setClaimModalOpen(false);
                    clearEvidence();
                  }}
                  className="px-4 py-2 rounded-lg bg-[#241611] text-[#E5E4E2] text-xs hover:bg-[#341F18]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimLoading || !claimMessage.trim()}
                  className="px-4 py-2 rounded-lg bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] text-xs font-bold transition disabled:opacity-50"
                >
                  {claimLoading ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Report Modal ── */}
      {editModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#6F4E37] bg-[#1B110C] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#E5E4E2]/60 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-[#FAF9F8] flex items-center gap-2">
              <Edit3 size={18} className="text-[#C68B59]" /> Edit Listing Details
            </h3>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#E5E4E2] mb-1">Item Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#6F4E37]/60 bg-[#120906] p-2.5 text-xs text-[#FAF9F8] outline-none focus:border-[#E6E0F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#E5E4E2] mb-1">Visible Description *</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-[#6F4E37]/60 bg-[#120906] p-2.5 text-xs text-[#FAF9F8] outline-none focus:border-[#E6E0F0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#E5E4E2] mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#6F4E37]/60 bg-[#120906] p-2.5 text-[#FAF9F8] outline-none"
                  >
                    {ITEM_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#E5E4E2] mb-1">Campus Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-xl border border-[#6F4E37]/60 bg-[#120906] p-2.5 text-[#FAF9F8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#E5E4E2] mb-1">Color</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full rounded-xl border border-[#6F4E37]/60 bg-[#120906] p-2.5 text-[#FAF9F8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#E5E4E2] mb-1">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full rounded-xl border border-[#6F4E37]/60 bg-[#120906] p-2.5 text-[#FAF9F8] outline-none"
                  />
                </div>
              </div>

              {editError && (
                <p className="text-xs p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300">
                  {editError}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#241611] text-[#E5E4E2] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] text-xs font-bold transition disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
