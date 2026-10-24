import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { CheckCircle, FileSearch } from '../../lib/icons.js';
import { Sparkles, ThumbsDown, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MatchesView() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.matches.list();
      setMatches(res.data || []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleDismiss = async (matchId) => {
    try {
      await api.matches.dismiss(matchId, 'DISMISSED');
      setMatches((curr) => curr.filter((m) => m.id !== matchId));
      setActionMessage('Match candidate dismissed.');
      setTimeout(() => setActionMessage(''), 2500);
    } catch (err) {
      alert(err.message || 'Failed to dismiss match');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {actionMessage && (
        <div className="rounded-xl border border-signal-500/30 bg-signal-500/10 p-3 text-xs text-signal-300">
          {actionMessage}
        </div>
      )}

      <FloatingPanel title="Possible Matches">
        <p className="mb-4 text-sm text-platinum-500/75">
          Deterministic and attribute match candidates comparing reported lost and found items.
        </p>

        {loading ? (
          <div className="py-16 text-center text-platinum-500/70 text-sm">
            Scanning for potential item matches...
          </div>
        ) : matches.length === 0 ? (
          <div className="py-16 text-center text-platinum-500/80 space-y-2">
            <p className="font-semibold text-platinum-400">No match suggestions found</p>
            <p className="text-xs text-platinum-500">
              When a report shares matching attributes (category, color, brand, or location) with another campus item, candidates appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const repA = match.reportA;
              const repB = match.reportB;
              const scoreNum = Number(match.score || 0);

              return (
                <article
                  key={match.id}
                  className="p-5 rounded-xl bg-mocha-800/40 border border-mocha-700/70 flex flex-col md:flex-row gap-6 relative overflow-hidden"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-lavender-300 text-xs font-semibold tracking-wide">
                      <Sparkles size={15} />
                      <span>Match Score: {scoreNum.toFixed(0)}%</span>
                      <span className="text-[10px] bg-mocha-900 border border-mocha-700 text-platinum-500 px-1.5 py-0.5 rounded font-mono">
                        {match.algorithmVersion || 'v1.0'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-mocha-900/60 p-3 rounded-lg border border-mocha-700/40">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-lavender-400">Report A ({repA?.reportType || 'LOST'})</span>
                        <h4 className="font-semibold text-platinum-300 mt-0.5 line-clamp-1">{repA?.title || 'Report A'}</h4>
                        <p className="text-platinum-500 text-[11px] line-clamp-2 mt-1">{repA?.publicDescription}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-signal-400">Report B ({repB?.reportType || 'FOUND'})</span>
                        <h4 className="font-semibold text-platinum-300 mt-0.5 line-clamp-1">{repB?.title || 'Report B'}</h4>
                        <p className="text-platinum-500 text-[11px] line-clamp-2 mt-1">{repB?.publicDescription}</p>
                      </div>
                    </div>

                    {match.scoreBreakdown && typeof match.scoreBreakdown === 'object' && (
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {Object.entries(match.scoreBreakdown).map(([k, v]) => (
                          <span key={k} className="bg-mocha-900 text-platinum-400 px-2 py-0.5 rounded border border-mocha-700/60">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDismiss(match.id)}
                      className="flex-1 bg-mocha-800 hover:bg-mocha-700 text-platinum-400 px-4 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                    >
                      <ThumbsDown size={14} /> Not a match
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </FloatingPanel>
    </div>
  );
}
