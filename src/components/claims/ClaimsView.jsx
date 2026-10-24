import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Check, Clock, Fingerprint, Lock, X } from '../../lib/icons.js';
import { AlertCircle, Eye, FileText, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ClaimsView() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const isMod = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.claims.list();
      const list = res.data || [];
      setClaims(list);
      if (list.length > 0 && !selectedClaim) {
        setSelectedClaim(list[0]);
      }
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClaims();
    } else {
      setLoading(false);
      setClaims([]);
    }
  }, [user]);

  // Load evidence URL when selectedClaim changes
  useEffect(() => {
    setEvidenceUrl('');
    if (selectedClaim?.id) {
      api.claims.getEvidenceUrl(selectedClaim.id)
        .then((res) => {
          if (res?.data?.evidenceUrl) setEvidenceUrl(res.data.evidenceUrl);
        })
        .catch(() => {
          setEvidenceUrl('');
        });
    }
  }, [selectedClaim]);

  const handleDecision = async (decision, reason) => {
    if (!selectedClaim) return;
    setActionLoading(true);
    setFeedback('');
    try {
      await api.claims.decision(selectedClaim.id, decision, reason);
      setFeedback(`Decision recorded: ${decision}`);
      setSelectedClaim((curr) => curr ? { ...curr, status: decision, decisionReason: reason } : null);
      fetchClaims();
    } catch (err) {
      setFeedback(`Error: ${err.message || 'Failed to record decision'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <FloatingPanel title="Ownership Claims">
          <div className="py-12 text-center text-platinum-400 space-y-3">
            <Lock size={32} className="mx-auto text-lavender-400" />
            <p className="font-semibold text-lg">Sign-in Required</p>
            <p className="text-xs text-platinum-500 max-w-md mx-auto">
              Please sign in to track your ownership claims or review submitted claims as a moderator.
            </p>
          </div>
        </FloatingPanel>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
      {/* Claims List */}
      <FloatingPanel title={isMod ? 'All Claims (Moderator Queue)' : 'Your Claims'} className="col-span-1">
        {loading ? (
          <p className="text-xs text-platinum-500 py-6 text-center">Loading claims...</p>
        ) : claims.length === 0 ? (
          <div className="py-8 text-center text-platinum-500 text-xs space-y-1">
            <p className="font-medium text-platinum-400">No claims found</p>
            <p className="text-[11px]">When you submit an ownership claim on a found item, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {claims.map((c) => {
              const active = selectedClaim?.id === c.id;
              const isApproved = c.status === 'APPROVED';
              const isRejected = c.status === 'REJECTED';
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClaim(c)}
                  className={`p-3 rounded-lg border transition cursor-pointer text-left ${
                    active
                      ? 'bg-mocha-800 border-lavender-500/80 shadow-md'
                      : 'bg-mocha-900/60 border-mocha-700/60 hover:bg-mocha-800/60'
                  }`}
                >
                  <p className="text-sm font-semibold text-platinum-300 truncate">
                    {c.report?.title || 'Report item'}
                  </p>
                  <p className="text-xs text-platinum-500 truncate mt-0.5">
                    {c.message}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-mocha-700/40 text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isApproved
                          ? 'bg-signal-500/20 text-signal-300'
                          : isRejected
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-lavender-500/20 text-lavender-300'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-platinum-500/70 font-mono">
                      {new Date(c.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FloatingPanel>

      {/* Claim Detail & Review Panel */}
      <FloatingPanel title="Claim Verification Details" className="col-span-1 md:col-span-2">
        {selectedClaim ? (
          <div className="flex flex-col h-full space-y-4">
            {feedback && (
              <div className="p-2.5 rounded-lg bg-mocha-800 border border-mocha-600 text-xs text-platinum-300">
                {feedback}
              </div>
            )}

            <div className="bg-mocha-900/70 rounded-xl p-4 border border-mocha-700/70 space-y-4">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-signal-400">
                    Target Item
                  </span>
                  <h3 className="text-lg font-bold text-platinum-200">
                    {selectedClaim.report?.title || 'Report Item'}
                  </h3>
                  <p className="text-xs text-platinum-500">
                    Claimant: {selectedClaim.claimant?.displayName || 'User'} ({selectedClaim.claimant?.email || 'authenticated'})
                  </p>
                </div>
                <div className="bg-mocha-800 px-2.5 py-1 rounded border border-mocha-700 text-xs text-platinum-400 flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Submitted {new Date(selectedClaim.submittedAt).toLocaleString()}</span>
                </div>
              </div>

              <hr className="border-mocha-700/60" />

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-platinum-400 mb-1 flex items-center gap-1.5">
                  <FileText size={14} className="text-lavender-300" /> Claimant Message
                </h4>
                <div className="p-3 bg-mocha-950/70 rounded-lg text-xs text-platinum-300 leading-relaxed border border-mocha-800">
                  {selectedClaim.message}
                </div>
              </div>

              {/* Private Evidence Preview */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-platinum-400 mb-1 flex items-center gap-1.5">
                  <Lock size={14} className="text-signal-400" /> Private Evidence
                </h4>
                {evidenceUrl ? (
                  <div className="p-3 bg-mocha-950/70 rounded-lg border border-mocha-800 space-y-2">
                    <p className="text-[11px] text-signal-300/80">Authorized secure access granted:</p>
                    <div className="max-w-xs max-h-48 overflow-hidden rounded border border-mocha-700 bg-black">
                      <img src={evidenceUrl} alt="Claim private evidence" className="object-contain w-full h-full" />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-mocha-950/70 rounded-lg text-xs text-platinum-500 border border-mocha-800 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-signal-400" />
                    <span>No separate photographic evidence attached or evidence is stored in encrypted vault.</span>
                  </div>
                )}
              </div>

              {selectedClaim.decisionReason && (
                <div className="p-3 bg-mocha-800/80 rounded-lg border border-mocha-700 text-xs">
                  <span className="font-semibold text-platinum-300">Decision Note:</span>{' '}
                  <span className="text-platinum-400">{selectedClaim.decisionReason}</span>
                </div>
              )}
            </div>

            {/* Moderator Action Buttons */}
            {isMod && selectedClaim.status !== 'APPROVED' && selectedClaim.status !== 'REJECTED' && (
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('APPROVED', 'Ownership confirmed by moderator verification.')}
                  className="flex-1 bg-signal-500 hover:bg-signal-400 text-black py-2.5 px-4 rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <Check size={15} /> Approve Claim
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('MORE_INFO_REQUESTED', 'Please provide additional identifying details.')}
                  className="flex-1 bg-mocha-800 hover:bg-mocha-700 text-platinum-300 py-2.5 px-4 rounded-xl border border-mocha-600 font-medium text-xs transition"
                >
                  Request More Info
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('REJECTED', 'Details provided do not match the item.')}
                  className="bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 py-2.5 px-4 rounded-xl font-medium text-xs transition flex items-center justify-center gap-1.5"
                >
                  <X size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-platinum-500 text-xs">
            Select a claim from the list to review details.
          </div>
        )}
      </FloatingPanel>
    </div>
  );
}
