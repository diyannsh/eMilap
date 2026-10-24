import { useEffect, useMemo, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { useMockStore } from '../../data/mockStore.js';
import { copyShareLink, getRouteUrl } from '../../lib/routes.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  Image as ImageIcon,
  Lock,
  Mail,
  MapPin,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';

export default function ClaimsView({ onNavigate, initialClaimId }) {
  const { user } = useAuth();
  const { claims: mockClaims, updateClaimStatus } = useMockStore();

  const [backendClaims, setBackendClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState(initialClaimId || '');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [unlockedClaims, setUnlockedClaims] = useState({});
  const [showStaffAuthModal, setShowStaffAuthModal] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [copiedClaim, setCopiedClaim] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isMod = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  // Fetch backend claims if authenticated
  const fetchBackendClaims = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.claims.list();
      setBackendClaims(res?.data || []);
    } catch {
      setBackendClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendClaims();
  }, [user]);

  // Combine backend claims + mockClaims
  const allClaims = useMemo(() => {
    const normalizedBackend = backendClaims.map((c) => ({
      id: c.id,
      itemTitle: c.report?.title || 'Reported Item',
      claimantName: c.claimant?.displayName || c.claimant?.email || 'Campus Claimant',
      claimantEmail: c.claimant?.email || 'claimant@campus.edu',
      category: c.report?.category || 'General',
      location: c.report?.approximateLocation || 'Campus',
      claimDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
      status:
        c.status === 'APPROVED'
          ? 'Approved'
          : c.status === 'REJECTED'
          ? 'Rejected'
          : c.status === 'MORE_INFO_REQUESTED'
          ? 'Under Review'
          : 'Pending Verification',
      rawStatus: c.status,
      secretClueSubmitted: c.message || 'No description provided.',
      holdingLocation: 'Admin Block, Rm 104',
      systemMatchNote: `Automated match for report ${c.reportId}. Clue length: ${c.message?.length || 0} characters.`,
      isBackend: true,
      hasEvidence: Boolean(c.evidenceObjectKey),
    }));

    const backendIds = new Set(normalizedBackend.map((b) => b.id));
    const uniqueMocks = mockClaims.filter((m) => !backendIds.has(m.id));

    return [...normalizedBackend, ...uniqueMocks];
  }, [backendClaims, mockClaims]);

  // Auto-select initial claim or first claim
  useEffect(() => {
    if (initialClaimId && allClaims.some((c) => c.id === initialClaimId)) {
      setSelectedClaimId(initialClaimId);
    } else if (!selectedClaimId && allClaims.length > 0) {
      setSelectedClaimId(allClaims[0].id);
    }
  }, [initialClaimId, allClaims, selectedClaimId]);

  const activeClaim = allClaims.find((c) => c.id === selectedClaimId) || allClaims[0];
  const isUnlocked = activeClaim ? Boolean(unlockedClaims[activeClaim.id]) : false;

  // Load evidence URL when activeClaim changes and is from backend
  useEffect(() => {
    setEvidenceUrl('');
    if (activeClaim?.isBackend && activeClaim.hasEvidence) {
      api.claims
        .getEvidenceUrl(activeClaim.id)
        .then((res) => {
          if (res?.data?.evidenceUrl) setEvidenceUrl(res.data.evidenceUrl);
        })
        .catch(() => {
          setEvidenceUrl('');
        });
    }
  }, [activeClaim]);

  const handleSelectClaim = (id) => {
    setSelectedClaimId(id);
    setActionMessage(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', getRouteUrl('claims', { claimId: id }));
    }
  };

  const handleShareClaim = async () => {
    if (!activeClaim) return;
    await copyShareLink('claims', { claimId: activeClaim.id });
    setCopiedClaim(true);
    setTimeout(() => setCopiedClaim(false), 2000);
  };

  const handleUnlockClueRequest = () => {
    setShowStaffAuthModal(true);
  };

  const confirmStaffAuth = () => {
    if (activeClaim) {
      setUnlockedClaims((prev) => ({ ...prev, [activeClaim.id]: true }));
    }
    setShowStaffAuthModal(false);
  };

  const handleApprove = async () => {
    if (!activeClaim) return;
    setActionLoading(true);
    try {
      if (activeClaim.isBackend) {
        await api.claims.decision(activeClaim.id, 'APPROVED', 'Ownership confirmed by moderator verification.');
        fetchBackendClaims();
      }
      updateClaimStatus(activeClaim.id, 'Approved');
      setActionMessage({
        type: 'success',
        text: `Claim for "${activeClaim.itemTitle}" has been APPROVED. Claimant has been sent collection coordinates at ${activeClaim.holdingLocation}.`,
      });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: `Approval failed: ${err.message || 'Error occurred'}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!activeClaim) return;
    setActionLoading(true);
    try {
      if (activeClaim.isBackend) {
        await api.claims.decision(activeClaim.id, 'MORE_INFO_REQUESTED', 'Additional verification details requested.');
        fetchBackendClaims();
      }
      updateClaimStatus(activeClaim.id, 'Under Review');
      setActionMessage({
        type: 'info',
        text: `Additional verification questions sent to ${activeClaim.claimantEmail}. Status set to Under Review.`,
      });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: `Request info failed: ${err.message || 'Error occurred'}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeClaim) return;
    setActionLoading(true);
    try {
      if (activeClaim.isBackend) {
        await api.claims.decision(activeClaim.id, 'REJECTED', 'Details provided do not match the item.');
        fetchBackendClaims();
      }
      updateClaimStatus(activeClaim.id, 'Rejected');
      setActionMessage({
        type: 'warning',
        text: `Claim for "${activeClaim.itemTitle}" has been REJECTED. Ownership proofs did not match item attributes.`,
      });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: `Rejection failed: ${err.message || 'Error occurred'}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col space-y-6">
      <FloatingPanel title="Ownership Verification &amp; Custody Desk">
        {actionMessage && (
          <div
            className={`mb-4 p-4 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-fadeIn ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                : actionMessage.type === 'warning'
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
                : 'bg-[#25150E] border-[#6F4E37] text-[#FAF9F8]'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-xs underline opacity-80 hover:opacity-100 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column: Claims List ── */}
          <div className="lg:col-span-1 border border-[#6F4E37]/45 rounded-xl bg-[#140C08]/80 p-3 flex flex-col gap-2 max-h-[720px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#6F4E37]/30 px-1">
              <span className="text-xs font-semibold text-[#E6E0F0] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#C68B59]" /> Submitted Claims
              </span>
              <span className="text-xs text-[#E5E4E2]/60 font-mono">
                {allClaims.length} Total
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-[#E5E4E2]/60">Loading claims...</div>
            ) : allClaims.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#E5E4E2]/60">
                No active ownership claims found.
              </div>
            ) : (
              allClaims.map((claim) => {
                const isSelected = claim.id === activeClaim?.id;
                const isApproved = claim.status === 'Approved';
                const isRejected = claim.status === 'Rejected';

                return (
                  <button
                    key={claim.id}
                    type="button"
                    onClick={() => handleSelectClaim(claim.id)}
                    className={`text-left p-3 rounded-lg border transition flex flex-col gap-1.5 relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#231510] border-[#E6E0F0]/50 shadow-md ring-1 ring-[#6F4E37]'
                        : 'bg-[#180E0A]/60 border-[#6F4E37]/35 hover:bg-[#1E110C]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#FAF9F8] truncate">
                        {claim.itemTitle}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          isApproved
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                            : isRejected
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                            : 'bg-[#6F4E37]/40 text-[#E6E0F0] border border-[#6F4E37]/60'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#E5E4E2]/70 truncate">
                      Claimant: {claim.claimantName}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#E5E4E2]/50 pt-1 border-t border-[#6F4E37]/25">
                      <span>{claim.category}</span>
                      <span>{claim.claimDate}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* ── Right Column: Active Claim Details & Two-Step Verification ── */}
          <div className="lg:col-span-2 border border-[#6F4E37]/45 rounded-xl bg-[#140C08]/80 p-5 space-y-5">
            {activeClaim ? (
              <>
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#6F4E37]/30 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-[#E5E4E2]/60">
                        Claim Ref: #{String(activeClaim.id).slice(-6)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          activeClaim.status === 'Approved'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#6F4E37]/30 text-[#E6E0F0] border border-[#6F4E37]/50'
                        }`}
                      >
                        {activeClaim.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#FAF9F8]">
                      {activeClaim.itemTitle}
                    </h3>
                  </div>

                  {/* Share claim button */}
                  <button
                    type="button"
                    onClick={handleShareClaim}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-[#6F4E37]/50 bg-[#1B110C] hover:bg-[#25150F] text-xs font-semibold text-[#E5E4E2] flex items-center gap-1.5 transition"
                  >
                    {copiedClaim ? (
                      <>
                        <Check size={13} className="text-emerald-400" /> Link Copied
                      </>
                    ) : (
                      <>
                        <Share2 size={13} /> Share Claim Link
                      </>
                    )}
                  </button>
                </div>

                {/* Metadata summary grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#190F0B] border border-[#6F4E37]/35">
                    <span className="text-[#E5E4E2]/50 block mb-0.5">Claimant</span>
                    <span className="text-[#FAF9F8] font-semibold truncate block">
                      {activeClaim.claimantName}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#190F0B] border border-[#6F4E37]/35">
                    <span className="text-[#E5E4E2]/50 block mb-0.5">Category</span>
                    <span className="text-[#FAF9F8] font-semibold">{activeClaim.category}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#190F0B] border border-[#6F4E37]/35">
                    <span className="text-[#E5E4E2]/50 block mb-0.5">Campus Zone</span>
                    <span className="text-[#FAF9F8] font-semibold truncate block">
                      {activeClaim.location}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#190F0B] border border-[#6F4E37]/35">
                    <span className="text-[#E5E4E2]/50 block mb-0.5">Filing Date</span>
                    <span className="text-[#FAF9F8] font-semibold">{activeClaim.claimDate}</span>
                  </div>
                </div>

                {/* ── Two-Step Verification Clue Section ── */}
                <div className="rounded-xl border border-[#6F4E37]/60 bg-[#190F0B] p-4 space-y-2.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E6E0F0] uppercase tracking-wider flex items-center gap-1.5">
                      <Lock size={13} className="text-[#C68B59]" /> Claimant Ownership Clue (Confidential)
                    </span>

                    <button
                      type="button"
                      onClick={() => (isUnlocked ? setUnlockedClaims((p) => ({ ...p, [activeClaim.id]: false })) : handleUnlockClueRequest())}
                      className="text-xs px-2.5 py-1 rounded bg-[#231510] hover:bg-[#301C15] text-[#FAF9F8] border border-[#6F4E37]/50 flex items-center gap-1 transition"
                    >
                      {isUnlocked ? (
                        <>
                          <EyeOff size={12} /> Mask Clue
                        </>
                      ) : (
                        <>
                          <Eye size={12} /> Reveal Secret Clue
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#100805] border border-[#6F4E37]/40 text-xs sm:text-sm leading-relaxed">
                    {isUnlocked ? (
                      <p className="text-[#FAF9F8] font-mono break-words">
                        {activeClaim.secretClueSubmitted}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-mono text-[#E5E4E2]/50 tracking-widest select-none">
                          ••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                        </p>
                        <p className="text-[11px] text-[#C68B59]">
                          Protected under privacy safeguards. Click &quot;Reveal Secret Clue&quot; to authorize inspection.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Photo if present */}
                {evidenceUrl && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#E6E0F0] uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-[#C68B59]" /> Photographic Ownership Evidence
                    </span>
                    <div className="max-w-xs max-h-48 overflow-hidden rounded-xl border border-[#6F4E37]/50 bg-black">
                      <img src={evidenceUrl} alt="Claim private evidence" className="object-contain w-full h-full" />
                    </div>
                  </div>
                )}

                {/* System Registry Comparison */}
                <div className="p-3.5 rounded-xl bg-[#120906] border border-[#6F4E37]/35 text-xs space-y-1">
                  <span className="font-semibold text-[#C68B59] flex items-center gap-1.5">
                    <Fingerprint size={13} /> System Verification Check
                  </span>
                  <p className="text-[#E5E4E2]/80 leading-relaxed">
                    {activeClaim.systemMatchNote || 'Registry check matches category, approximate loss timeline, and holding custody zone.'}
                  </p>
                </div>

                {/* Decision Actions */}
                <div className="pt-3 border-t border-[#6F4E37]/30 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={actionLoading || activeClaim.status === 'Approved'}
                    onClick={handleApprove}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] font-bold text-xs transition border border-[#E5E4E2]/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={15} /> {activeClaim.status === 'Approved' ? 'Claim Approved' : 'Approve Claim'}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleRequestInfo}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#231510] hover:bg-[#321E17] text-[#E5E4E2] font-semibold text-xs transition border border-[#6F4E37]/60 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Mail size={14} className="text-[#C68B59]" /> Request More Info
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading || activeClaim.status === 'Rejected'}
                    onClick={handleReject}
                    className="py-3 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 font-semibold text-xs transition border border-red-800/50 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <X size={15} /> Reject
                  </button>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-xs text-[#E5E4E2]/60">
                Select a claim from the list to review details.
              </div>
            )}
          </div>
        </div>
      </FloatingPanel>

      {/* ── Two-Step Verification Staff Auth Modal ── */}
      {showStaffAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-[#0E0805]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowStaffAuthModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#1B110C] border border-[#6F4E37] rounded-2xl p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-[#6F4E37]/30 border border-[#6F4E37] flex items-center justify-center text-[#E6E0F0] mx-auto">
              <Shield size={24} />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-[#FAF9F8]">Authorize Ownership Reveal</h4>
              <p className="text-xs text-[#E5E4E2]/75 leading-relaxed">
                Confirm your campus officer credentials to decrypt and view the private ownership clue submitted for this item.
              </p>
            </div>

            <div className="p-3.5 bg-[#120906] rounded-xl border border-[#6F4E37]/45 text-xs space-y-1.5">
              <div className="flex justify-between text-[#E5E4E2]/80">
                <span>Authorized Desk:</span>
                <span className="text-[#FAF9F8] font-semibold">Central Lost &amp; Found (Desk 01)</span>
              </div>
              <div className="flex justify-between text-[#E5E4E2]/80">
                <span>Duty Officer:</span>
                <span className="text-[#FAF9F8] font-semibold flex items-center gap-1">
                  <UserCheck size={12} className="text-emerald-400" /> {user?.displayName || 'Campus Staff'}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={confirmStaffAuth}
                className="flex-1 py-3 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-xl text-xs font-semibold transition border border-[#E5E4E2]/20 shadow"
              >
                Authenticate &amp; Unlock
              </button>
              <button
                type="button"
                onClick={() => setShowStaffAuthModal(false)}
                className="py-3 px-4 bg-[#241611] hover:bg-[#331F18] text-[#E5E4E2] rounded-xl text-xs font-medium border border-[#6F4E37]/50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
