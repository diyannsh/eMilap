import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { useMockStore } from '../../data/mockStore.js';
import { copyShareLink, getRouteUrl } from '../../lib/routes.js';
import {
  Check,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Fingerprint,
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
  const { claims, updateClaimStatus } = useMockStore();
  const [selectedClaimId, setSelectedClaimId] = useState(initialClaimId || claims[0]?.id || 'claim-1');
  const [unlockedClaims, setUnlockedClaims] = useState({});
  const [showStaffAuthModal, setShowStaffAuthModal] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [copiedClaim, setCopiedClaim] = useState(false);

  useEffect(() => {
    if (initialClaimId && claims.some((c) => c.id === initialClaimId)) {
      setSelectedClaimId(initialClaimId);
    }
  }, [initialClaimId, claims]);

  const activeClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];
  const isUnlocked = activeClaim ? Boolean(unlockedClaims[activeClaim.id]) : false;

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
    setTimeout(() => setCopiedClaim(false), 2200);
  };

  const handleRevealClue = () => {
    setShowStaffAuthModal(true);
  };

  const confirmStaffAuth = () => {
    if (activeClaim) {
      setUnlockedClaims((prev) => ({ ...prev, [activeClaim.id]: true }));
    }
    setShowStaffAuthModal(false);
  };

  const handleMaskClue = () => {
    if (activeClaim) {
      setUnlockedClaims((prev) => ({ ...prev, [activeClaim.id]: false }));
    }
  };

  const handleApprove = () => {
    if (!activeClaim) return;
    updateClaimStatus(activeClaim.id, 'Approved');
    setActionMessage({
      type: 'success',
      text: `Claim for "${activeClaim.itemTitle}" has been approved. The claimant has been notified to pick up their item at ${activeClaim.location}.`,
    });
  };

  const handleReject = () => {
    if (!activeClaim) return;
    updateClaimStatus(activeClaim.id, 'Rejected');
    setActionMessage({
      type: 'error',
      text: `Claim for "${activeClaim.itemTitle}" has been rejected.`,
    });
  };

  const handleRequestInfo = () => {
    if (!activeClaim) return;
    setActionMessage({
      type: 'info',
      text: `Automated inquiry dispatched to ${activeClaim.claimant} requesting supplementary purchase receipt or serial photo.`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
      {/* ── Left Sidebar: Claims Queue ── */}
      <FloatingPanel title="Claims Queue" className="lg:col-span-1">
        <p className="text-xs text-[#E5E4E2]/70 mb-3">
          Select a pending claim submitted by a student or staff member:
        </p>
        <div className="space-y-2.5">
          {claims.map((claim) => {
            const isSelected = claim.id === activeClaim?.id;
            return (
              <div
                key={claim.id}
                onClick={() => handleSelectClaim(claim.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1D110C] border-[#E6E0F0]/70 border-l-4 border-l-[#E6E0F0] shadow-lg'
                    : 'bg-[#140C08]/80 border-[#6F4E37]/45 hover:border-[#6F4E37]/80 hover:bg-[#1A100B]'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-semibold text-[#FAF9F8] truncate">{claim.itemTitle}</p>
                  <span
                    className={`shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                      claim.status === 'Approved'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : claim.status === 'Rejected'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                        : 'bg-[#E6E0F0]/15 text-[#E6E0F0] border-[#E6E0F0]/30'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>
                <p className="text-xs text-[#E5E4E2]/70 mt-1">Claimant: {claim.claimant}</p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-[#C68B59]">
                  <Clock size={11} /> {claim.submittedTime}
                </div>
              </div>
            );
          })}
        </div>
      </FloatingPanel>

      {/* ── Right Panel: Two-Step Ownership Claim Review ── */}
      <FloatingPanel title="Ownership Verification Desk" className="lg:col-span-2">
        {activeClaim ? (
          <div className="flex flex-col space-y-5">
            {/* Action Feedback Banner */}
            {actionMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm border flex items-center justify-between gap-3 animate-fadeIn ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                    : actionMessage.type === 'error'
                    ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                    : 'bg-[#2E1D16] border-[#6F4E37]/80 text-[#E5E4E2]'
                }`}
              >
                <span>{actionMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setActionMessage(null)}
                  className="hover:opacity-75 p-1"
                  aria-label="Dismiss banner"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Claim Header Details */}
            <div className="bg-[#140C08]/90 rounded-2xl p-5 sm:p-6 border border-[#6F4E37]/60 space-y-4 shadow-xl">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#C68B59]">
                    Claim Reference #{activeClaim.id.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-bold text-[#FAF9F8] mt-0.5">{activeClaim.itemTitle}</h3>
                  <p className="text-xs sm:text-sm text-[#E5E4E2]/75 mt-1 flex items-center gap-2">
                    <span>Submitted by <strong className="text-[#FAF9F8]">{activeClaim.claimant}</strong></span>
                    <span className="text-[#6F4E37]">•</span>
                    <span>ID: {activeClaim.studentIdMasked}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareClaim}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                      copiedClaim
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        : 'bg-[#1E130E] text-[#E5E4E2] border-[#6F4E37]/60 hover:bg-[#341F18]'
                    }`}
                    title="Copy direct share link for this claim"
                  >
                    {copiedClaim ? (
                      <>
                        <Check size={13} /> Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 size={13} /> Share Link
                      </>
                    )}
                  </button>

                  <div className="bg-[#1E130E] px-3 py-1.5 rounded-lg border border-[#6F4E37]/60 text-xs text-[#E6E0F0] flex items-center gap-1.5">
                    <Clock size={13} /> {activeClaim.submittedTime}
                  </div>
                  <span
                    className={`text-xs uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border ${
                      activeClaim.status === 'Approved'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        : activeClaim.status === 'Rejected'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                        : 'bg-[#6F4E37]/35 text-[#E6E0F0] border-[#6F4E37]/70'
                    }`}
                  >
                    {activeClaim.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#E5E4E2]/70 pt-1 border-t border-[#6F4E37]/30">
                <MapPin size={13} className="text-[#C68B59]" /> Found at: {activeClaim.location}
              </div>

              {/* ── Two-Step Verification Section ── */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#E6E0F0] flex items-center gap-2">
                    <Lock size={15} /> Private Ownership Clue
                  </h4>
                  {isUnlocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <ShieldCheck size={13} /> Staff Authenticated
                    </span>
                  )}
                </div>

                {isUnlocked ? (
                  /* Revealed State */
                  <div className="p-4 bg-[#100805] rounded-xl border border-emerald-500/40 space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-sm text-[#FAF9F8] font-mono leading-relaxed">
                        &ldquo;{activeClaim.privateClue}&rdquo;
                      </div>
                      <button
                        type="button"
                        onClick={handleMaskClue}
                        className="text-xs text-[#E5E4E2]/60 hover:text-[#FAF9F8] flex items-center gap-1 px-2.5 py-1 rounded bg-[#1B110C] border border-[#6F4E37]/50 shrink-0 transition"
                      >
                        <EyeOff size={13} /> Mask
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[#6F4E37]/25 text-xs text-emerald-300/90 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Private detail revealed for authorized staff inspection.
                    </div>
                  </div>
                ) : (
                  /* Masked Two-Step Verification Gate */
                  <div className="p-5 bg-[#100805]/95 rounded-xl border border-[#6F4E37]/60 relative overflow-hidden space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#C68B59]">
                      <ShieldAlert size={15} /> Two-Step Verification Guard Active
                    </div>

                    {/* Masked clue representation */}
                    <div className="p-3 bg-[#0B0604] rounded-lg border border-[#6F4E37]/30 font-mono text-sm tracking-widest text-[#E5E4E2]/35 select-none blur-[1px]">
                      ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                    </div>

                    <p className="text-xs text-[#E5E4E2]/70 leading-relaxed">
                      To prevent fraud, private ownership notes submitted by claimants remain encrypted until authorized by campus desk personnel.
                    </p>

                    <button
                      type="button"
                      onClick={handleRevealClue}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] text-xs font-semibold rounded-lg border border-[#E5E4E2]/20 shadow-md transition"
                    >
                      <Eye size={14} /> Verify Staff ID &amp; Reveal Clue
                    </button>
                  </div>
                )}
              </div>

              {/* System Verification Match */}
              <div className="pt-2">
                <h4 className="text-sm font-semibold text-[#E5E4E2] mb-2 flex items-center gap-2">
                  <Fingerprint size={15} className="text-[#C68B59]" /> System Registry Comparison
                </h4>
                <div className="p-4 bg-[#100805] rounded-xl text-xs sm:text-sm text-[#E5E4E2]/85 border border-[#6F4E37]/40 leading-relaxed">
                  {activeClaim.systemMatchNote}
                </div>
              </div>
            </div>

            {/* Moderation Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={activeClaim.status === 'Approved'}
                className={`flex-1 py-3 px-5 rounded-xl font-semibold shadow-lg transition flex justify-center items-center gap-2 border ${
                  activeClaim.status === 'Approved'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 opacity-70 cursor-not-allowed'
                    : 'bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] border-[#E5E4E2]/25'
                }`}
              >
                <Check size={17} /> {activeClaim.status === 'Approved' ? 'Claim Approved' : 'Approve Claim'}
              </button>

              <button
                type="button"
                onClick={handleRequestInfo}
                className="flex-1 bg-[#241611] hover:bg-[#331F18] text-[#E5E4E2] py-3 px-5 rounded-xl border border-[#6F4E37]/60 transition font-medium text-xs sm:text-sm flex justify-center items-center gap-1.5"
              >
                <Mail size={15} className="text-[#C68B59]" /> Request More Info
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={activeClaim.status === 'Rejected'}
                className="bg-[#180E0A] hover:bg-[#281610] text-[#E6E0F0] px-5 py-3 rounded-xl border border-[#6F4E37]/40 transition font-medium flex justify-center items-center gap-1.5 text-xs sm:text-sm"
              >
                <X size={16} /> Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#E5E4E2]/60">No claim selected.</div>
        )}
      </FloatingPanel>

      {/* ── Two-Step Verification Staff Confirmation Modal ── */}
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
                  <UserCheck size={12} className="text-emerald-400" /> Sharma, D. (ID #8841)
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
