import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { ArrowRight, CheckCircle, FileSearch, Sparkles, ThumbsDown, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const SAMPLE_MATCH_CARDS = [
  {
    id: 'sample-match-1',
    confidence: '94% Match Score',
    foundItem: 'The North Face Surge Backpack',
    lostItem: 'Black backpack with red cord',
    location: 'Student Union & Dining',
    time: 'Yesterday, 3:30 PM',
    category: 'Bags & Backpacks',
    color: 'Black',
    notes: 'Found in cafeteria booth near west windows. Matches report description, front zip cord, and color.',
    badge: 'High Confidence',
    isSample: true,
  },
  {
    id: 'sample-match-2',
    confidence: '88% Match Score',
    foundItem: 'Apple AirPods Pro (2nd Gen)',
    lostItem: 'AirPods Pro with engraved initials',
    location: 'Main Library (2nd Floor)',
    time: 'Today, 10:15 AM',
    category: 'Electronics',
    color: 'White',
    notes: 'Found beside desk 14 study cubicle. White case with minor hinge scratch.',
    badge: 'Likely Match',
    isSample: true,
  },
];

export default function MatchesView({ onNavigate }) {
  const { user } = useAuth();
  const [matchList, setMatchList] = useState(SAMPLE_MATCH_CARDS);
  const [loading, setLoading] = useState(false);
  const [dismissedId, setDismissedId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchMatches = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.matches.list();
      const backendMatches = res?.data || [];
      if (backendMatches.length > 0) {
        const mapped = backendMatches.map((m) => {
          const repA = m.reportA || {};
          const repB = m.reportB || {};
          const scoreNum = Number(m.score || 0);
          return {
            id: m.id,
            confidence: `${scoreNum.toFixed(0)}% Match Score`,
            foundItem: repB.title || 'Found Campus Item',
            lostItem: repA.title || 'Lost Campus Item',
            location: repB.approximateLocation || repA.approximateLocation || 'Campus',
            time: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Recent',
            category: repB.category || repA.category || 'General',
            color: repB.color || repA.color || 'Unspecified',
            notes: repB.publicDescription || repA.publicDescription || 'Attributes matched by system algorithm.',
            badge: scoreNum > 85 ? 'High Confidence' : 'Possible Match',
            isBackend: true,
            raw: m,
          };
        });
        setMatchList(mapped);
      }
    } catch {
      // Offline fallback: keep sample matches
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user]);

  const handleDismiss = async (id) => {
    setDismissedId(id);
    const target = matchList.find((m) => m.id === id);

    if (target?.isBackend) {
      try {
        await api.matches.dismiss(id, 'DISMISSED');
      } catch (err) {
        console.warn('Failed to dismiss backend match:', err);
      }
    }

    setTimeout(() => {
      setMatchList((prev) => prev.filter((m) => m.id !== id));
      setDismissedId(null);
      setActionMessage('Match pair dismissed.');
      setTimeout(() => setActionMessage(''), 2500);
    }, 250);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {actionMessage && (
        <div className="rounded-xl border border-[#6F4E37]/60 bg-[#1A0F0A] p-3 text-xs text-[#E6E0F0] animate-fadeIn">
          {actionMessage}
        </div>
      )}

      <FloatingPanel title="Possible Matches">
        <p className="mb-5 text-sm text-[#E5E4E2]/75">
          Our intelligent campus matching algorithm pairs lost and found reports based on campus zone, category, item model, and descriptive attributes.
        </p>

        {loading ? (
          <div className="py-16 text-center text-[#E5E4E2]/60 text-sm">
            Scanning for potential item matches...
          </div>
        ) : matchList.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#140C08]/80 border border-[#6F4E37]/40 flex flex-col items-center justify-center gap-3">
            <CheckCircle size={36} className="text-emerald-400" />
            <h4 className="text-base font-semibold text-[#FAF9F8]">No pending match pairs</h4>
            <p className="text-xs text-[#E5E4E2]/70 max-w-sm">
              All potential report pairs have been reviewed or dismissed. Check back when new campus reports are filed.
            </p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('browse')}
                className="mt-2 px-4 py-2 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-lg text-xs font-semibold transition"
              >
                Browse All Campus Listings
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {matchList.map((match) => (
              <article
                key={match.id}
                className={`p-5 rounded-xl bg-[#140C08]/90 border border-[#6F4E37]/70 flex flex-col md:flex-row gap-6 relative overflow-hidden shadow-lg transition-all ${
                  dismissedId === match.id ? 'opacity-0 translate-x-4' : 'opacity-100'
                }`}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#E6E0F0]/10 rounded-bl-full blur-2xl pointer-events-none" />

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#C68B59] bg-[#C68B59]/20 border border-[#C68B59]/40 px-2.5 py-0.5 rounded">
                      <Sparkles size={12} /> {match.confidence}
                    </span>
                    <span className="text-xs text-[#E5E4E2]/60">Location: {match.location}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#FAF9F8]">{match.foundItem}</h3>
                    <p className="text-xs text-[#E6E0F0] mt-0.5 font-medium">
                      Paired with report: &ldquo;{match.lostItem}&rdquo;
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-[#E5E4E2]/80 leading-relaxed bg-[#100805]/70 p-3 rounded-lg border border-[#6F4E37]/35">
                    {match.notes}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] bg-[#1E130E] border border-[#6F4E37]/50 text-[#E5E4E2] px-2.5 py-1 rounded">
                      Category: {match.category}
                    </span>
                    <span className="text-[11px] bg-[#1E130E] border border-[#6F4E37]/50 text-[#E5E4E2] px-2.5 py-1 rounded">
                      Color: {match.color}
                    </span>
                    <span className="text-[11px] bg-[#1E130E] border border-[#6F4E37]/50 text-[#E5E4E2] px-2.5 py-1 rounded">
                      Reported: {match.time}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2.5 justify-center shrink-0 w-full md:w-44 pt-3 md:pt-0 border-t md:border-t-0 border-[#6F4E37]/30">
                  <button
                    type="button"
                    onClick={() => onNavigate?.('claims')}
                    className="flex-1 py-3 px-4 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-xl text-xs sm:text-sm font-semibold border border-[#E5E4E2]/20 shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    Review Claim <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(match.id)}
                    className="flex-1 py-3 px-4 bg-[#241611] hover:bg-[#331F18] text-[#E5E4E2] border border-[#6F4E37]/50 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1"
                  >
                    <X size={14} /> Not a match
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </FloatingPanel>
    </div>
  );
}
