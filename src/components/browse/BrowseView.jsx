import { useEffect, useRef, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { MapPin, Search } from '../../lib/icons.js';
import { Camera, Clock, Edit3, Filter, Image as ImageIcon, ImagePlus, Lock, ShieldAlert, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const CATEGORIES = ['ALL', 'Electronics', 'Water Bottles', 'Bags', 'Clothing', 'Books', 'Keys', 'Wallets', 'Other'];

export default function BrowseView() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, LOST, FOUND
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);

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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (filterCategory !== 'ALL') params.category = filterCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.reports.list(params);
      setReports(res.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterType, filterCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleCloseReport = async (reportId) => {
    try {
      await api.reports.close(reportId);
      setSelectedReport((curr) => curr ? { ...curr, status: 'CLOSED' } : null);
      fetchReports();
    } catch (err) {
      alert(err.message || 'Failed to close report');
    }
  };

  const openEditModal = (report) => {
    setEditTitle(report.title || '');
    setEditDescription(report.publicDescription || '');
    setEditCategory(report.category || 'Electronics');
    setEditColor(report.color || '');
    setEditBrand(report.brand || '');
    setEditLocation(report.approximateLocation || '');
    setEditError('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await api.reports.update(selectedReport.id, {
        title: editTitle.trim(),
        publicDescription: editDescription.trim(),
        category: editCategory,
        color: editColor.trim() || undefined,
        brand: editBrand.trim() || undefined,
        approximateLocation: editLocation.trim() || undefined,
      });
      setSelectedReport((curr) => curr ? { ...curr, ...updated.data } : null);
      setEditModalOpen(false);
      fetchReports();
    } catch (err) {
      setEditError(err.message || 'Failed to update report');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSelectEvidence = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPEG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Evidence photo must be smaller than 5 MB.');
      return;
    }
    setClaimEvidenceFile(file);
    setClaimEvidencePreview(URL.createObjectURL(file));
  };

  const clearEvidence = () => {
    if (claimEvidencePreview) URL.revokeObjectURL(claimEvidencePreview);
    setClaimEvidenceFile(null);
    setClaimEvidencePreview('');
    if (evidenceInputRef.current) evidenceInputRef.current.value = '';
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setClaimLoading(true);
    setClaimStatusMsg('');
    try {
      let evidenceKey = undefined;
      if (claimEvidenceFile) {
        const uploadRes = await api.uploads.uploadClaimEvidence(claimEvidenceFile);
        evidenceKey = uploadRes?.data?.objectKey;
      }

      await api.claims.create({
        reportId: selectedReport.id,
        message: claimMessage.trim(),
        evidenceKey,
      });
      setClaimStatusMsg('Ownership claim submitted successfully! A moderator or finder will review your details.');
      setClaimMessage('');
      clearEvidence();
      setTimeout(() => {
        setClaimModalOpen(false);
        setClaimStatusMsg('');
      }, 1500);
    } catch (err) {
      setClaimStatusMsg(`Error: ${err.message || 'Failed to submit claim'}`);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 bg-mocha-900/80 backdrop-blur-md rounded-xl p-2 border border-mocha-700 flex items-center px-4">
          <Search className="text-platinum-500 mr-3 shrink-0" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search listings"
            placeholder="Search by item name, color, category, or location..."
            className="bg-transparent border-none outline-none text-platinum-400 w-full placeholder:text-platinum-500/60"
          />
          <button type="submit" className="text-xs bg-mocha-800 hover:bg-mocha-700 px-3 py-1.5 rounded-lg text-platinum-400 shrink-0 transition">
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 bg-mocha-900/80 border border-mocha-700 rounded-xl p-1 shrink-0">
          {['ALL', 'LOST', 'FOUND'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === type ? 'bg-signal-500 text-black' : 'text-platinum-500 hover:text-platinum-300'
              }`}
            >
              {type === 'ALL' ? 'All' : type === 'LOST' ? 'Lost Items' : 'Found Items'}
            </button>
          ))}
        </div>

        <div className="bg-mocha-900/80 border border-mocha-700 rounded-xl px-2 py-1 flex items-center shrink-0">
          <Filter size={14} className="text-platinum-500 mr-1.5" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent text-xs text-platinum-300 outline-none cursor-pointer"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-mocha-900 text-platinum-300">
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FloatingPanel title="Campus Listings">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-platinum-500/75">
            Real campus reports. Click any listing to view public details or claim an item.
          </p>
          <span className="text-xs text-platinum-500 font-mono">
            {reports.length} {reports.length === 1 ? 'listing' : 'listings'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-platinum-500/70 text-sm">
            Loading directory listings...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-platinum-500/80 space-y-2">
            <p className="font-semibold text-platinum-400">No campus listings found</p>
            <p className="text-xs text-platinum-500">
              {searchQuery ? `No listings matched "${searchQuery}".` : 'There are currently no active lost or found reports in this directory.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const isFound = report.reportType === 'FOUND';
              const imageKey = report.images?.[0]?.objectKey;
              return (
                <article
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="p-4 rounded-xl bg-mocha-800/50 border border-mocha-700 flex flex-col gap-2.5 cursor-pointer hover:border-lavender-400/50 hover:bg-mocha-800/80 transition"
                >
                  {imageKey && (
                    <div className="w-full h-36 rounded-lg overflow-hidden bg-mocha-900 border border-mocha-700/50">
                      <img
                        src={`/api/v1/uploads/reports/${imageKey}`}
                        alt={report.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isFound ? 'bg-signal-500/20 text-signal-300' : 'bg-lavender-500/20 text-lavender-300'
                      }`}
                    >
                      {report.reportType}
                    </span>
                    <span className="text-[10px] text-platinum-500/70 font-mono">
                      {report.status}
                    </span>
                  </div>

                  <h4 className="text-platinum-300 font-semibold text-base line-clamp-1">{report.title}</h4>
                  <p className="text-platinum-500 text-xs line-clamp-2 leading-relaxed">{report.publicDescription}</p>

                  <div className="mt-auto pt-3 border-t border-mocha-700/50 flex items-center justify-between text-xs text-platinum-500/75">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{report.approximateLocation || 'Campus'}</span>
                    </span>
                    <span className="text-[11px] shrink-0 font-mono">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </FloatingPanel>

      {/* Report Detail Modal */}
      {selectedReport && !claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#1c1a1f] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-2 text-platinum-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                selectedReport.reportType === 'FOUND' ? 'bg-signal-500/20 text-signal-300' : 'bg-lavender-500/20 text-lavender-300'
              }`}>
                {selectedReport.reportType} ITEM
              </span>
              <span className="text-xs font-mono text-platinum-500">Status: {selectedReport.status}</span>
            </div>

            <h3 className="text-xl font-bold text-platinum-200 mt-1">{selectedReport.title}</h3>

            {selectedReport.images?.[0]?.objectKey && (
              <div className="mt-4 w-full h-48 rounded-xl overflow-hidden bg-mocha-900 border border-mocha-700/50">
                <img
                  src={`/api/v1/uploads/reports/${selectedReport.images[0].objectKey}`}
                  alt={selectedReport.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-platinum-500 font-semibold">Public Description</p>
                <p className="text-platinum-300 mt-1 leading-relaxed">{selectedReport.publicDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-mocha-700/50 text-xs">
                <div>
                  <span className="text-platinum-500">Category:</span>{' '}
                  <span className="text-platinum-300 font-medium">{selectedReport.category}</span>
                </div>
                {selectedReport.color && (
                  <div>
                    <span className="text-platinum-500">Color:</span>{' '}
                    <span className="text-platinum-300 font-medium">{selectedReport.color}</span>
                  </div>
                )}
                {selectedReport.brand && (
                  <div>
                    <span className="text-platinum-500">Brand:</span>{' '}
                    <span className="text-platinum-300 font-medium">{selectedReport.brand}</span>
                  </div>
                )}
                <div>
                  <span className="text-platinum-500">Location:</span>{' '}
                  <span className="text-platinum-300 font-medium">{selectedReport.approximateLocation || 'Campus'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-mocha-700/60 flex flex-wrap gap-2 justify-end">
              {user && (user.id === selectedReport.reporterId || user.id === selectedReport.reporter?.id || user.role === 'MODERATOR' || user.role === 'ADMIN') && selectedReport.status !== 'CLOSED' && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedReport)}
                    className="px-4 py-2 rounded-lg border border-lavender-500/40 text-lavender-300 hover:bg-lavender-950/40 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Edit3 size={13} /> Edit Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCloseReport(selectedReport.id)}
                    className="px-4 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-950/40 text-xs font-semibold transition"
                  >
                    Close Report
                  </button>
                </>
              )}

              {selectedReport.reportType === 'FOUND' && selectedReport.status === 'OPEN' && (
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-signal-500 hover:bg-signal-400 text-black text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Lock size={13} /> Claim This Item
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-lg bg-mocha-800 hover:bg-mocha-700 text-platinum-300 text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      {claimModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1a1f] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => { setClaimModalOpen(false); setClaimStatusMsg(''); clearEvidence(); }}
              className="absolute top-4 right-4 p-2 text-platinum-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-platinum-200 flex items-center gap-2">
              <Lock size={18} className="text-signal-400" /> Confirm Item Ownership
            </h3>
            <p className="text-xs text-platinum-500 mt-1">
              Claiming: <strong className="text-platinum-300">{selectedReport.title}</strong>
            </p>

            {!user ? (
              <p className="text-sm text-red-300 mt-4">Please sign in before submitting an ownership claim.</p>
            ) : (
              <form onSubmit={handleSubmitClaim} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-platinum-400 mb-1">
                    Private verification details *
                  </label>
                  <textarea
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    placeholder="Describe specific unique details only the true owner would know (e.g. serial numbers, stickers, specific contents, distinctive marks)..."
                    required
                    rows={4}
                    className="w-full rounded-xl border border-mocha-700 bg-mocha-900/60 p-3 text-xs text-platinum-300 outline-none focus:border-signal-500"
                  />
                  <p className="text-[10px] text-platinum-500/70 mt-1">
                    Never made public. Only visible to verified campus moderators and the finder during review.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-platinum-400 mb-1">
                    Private Photographic Evidence (Optional)
                  </label>
                  {claimEvidencePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-mocha-700 bg-mocha-900 h-28 max-w-xs">
                      <img src={claimEvidencePreview} alt="Evidence preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={clearEvidence}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded text-platinum-300 hover:text-white"
                        aria-label="Remove evidence"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => evidenceInputRef.current?.click()}
                      className="w-full border border-dashed border-mocha-700 rounded-xl p-3 text-center text-xs text-platinum-400 hover:border-lavender-400/60 hover:text-platinum-300 transition flex items-center justify-center gap-1.5"
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
                  <p className="text-[10px] text-platinum-500/70 mt-1">
                    JPEG, PNG, or WEBP up to 5MB. Stored securely and only viewable by authorized moderators.
                  </p>
                </div>

                {claimStatusMsg && (
                  <p className="text-xs p-2.5 rounded-lg bg-signal-500/10 border border-signal-500/30 text-signal-300 font-medium">
                    {claimStatusMsg}
                  </p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setClaimModalOpen(false); clearEvidence(); }}
                    className="px-4 py-2 rounded-lg bg-mocha-800 text-platinum-400 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading || !claimMessage.trim()}
                    className="px-4 py-2 rounded-lg bg-signal-500 hover:bg-signal-400 text-black text-xs font-bold transition disabled:opacity-50"
                  >
                    {claimLoading ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {editModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#1c1a1f] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-platinum-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-platinum-200 flex items-center gap-2">
              <Edit3 size={18} className="text-lavender-400" /> Edit Report Details
            </h3>
            <p className="text-xs text-platinum-500 mt-1">
              Updating: <strong className="text-platinum-300">{selectedReport.title}</strong>
            </p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-platinum-400 mb-1">Item Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-mocha-700 bg-mocha-900/60 p-2.5 text-xs text-platinum-300 outline-none focus:border-lavender-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-platinum-400 mb-1">Public Description *</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-mocha-700 bg-mocha-900/60 p-2.5 text-xs text-platinum-300 outline-none focus:border-lavender-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-platinum-400 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-mocha-700 bg-mocha-900 p-2.5 text-platinum-300 outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
                      <option key={cat} value={cat} className="bg-mocha-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-platinum-400 mb-1">Approximate Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-xl border border-mocha-700 bg-mocha-900/60 p-2.5 text-platinum-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-platinum-400 mb-1">Color</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full rounded-xl border border-mocha-700 bg-mocha-900/60 p-2.5 text-platinum-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-platinum-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full rounded-xl border border-mocha-700 bg-mocha-900/60 p-2.5 text-platinum-300 outline-none"
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
                  className="px-4 py-2 rounded-lg bg-mocha-800 text-platinum-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-lavender-500 hover:bg-lavender-400 text-black text-xs font-bold transition disabled:opacity-50"
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
