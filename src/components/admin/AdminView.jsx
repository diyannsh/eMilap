import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Shield, ShieldAlert, Check, X, RefreshCw, FileText, Lock } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminView() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeAccounts: 0, reportsToReview: 0, claimsToReview: 0 });
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState('');

  const isMod = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  const fetchData = async () => {
    if (!isMod) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [statsRes, reportsRes, claimsRes, logsRes] = await Promise.all([
        api.admin.getStats().catch(() => ({ data: { activeAccounts: 0, reportsToReview: 0, claimsToReview: 0 } })),
        api.admin.getReports().catch(() => ({ data: { reports: [] } })),
        api.admin.getClaims().catch(() => ({ data: { claims: [] } })),
        api.admin.getAuditLogs().catch(() => ({ data: { logs: [] } })),
      ]);
      setStats(statsRes.data || { activeAccounts: 0, reportsToReview: 0, claimsToReview: 0 });
      setReports(reportsRes.data?.reports || []);
      setClaims(claimsRes.data?.claims || []);
      setAuditLogs(logsRes.data?.logs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleReportAction = async (reportId, action) => {
    try {
      await api.admin.reportAction(reportId, action, `Action ${action} executed by moderator`);
      setActionFeedback(`Report ${reportId.slice(0, 8)}: ${action} applied.`);
      setTimeout(() => setActionFeedback(''), 3000);
      fetchData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  if (!user || !isMod) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <FloatingPanel title="Moderation & Administration">
          <div className="py-12 text-center text-platinum-400 space-y-3">
            <ShieldAlert size={36} className="mx-auto text-amber-400" />
            <p className="font-semibold text-lg text-platinum-200">Moderator Access Required</p>
            <p className="text-xs text-platinum-500 max-w-md mx-auto leading-relaxed">
              This panel is restricted to verified campus moderators and administrators. If you are an appointed moderator, please sign in with your moderator account credentials.
            </p>
          </div>
        </FloatingPanel>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {actionFeedback && (
        <div className="rounded-xl border border-signal-500/30 bg-signal-500/10 p-3 text-xs text-signal-300">
          {actionFeedback}
        </div>
      )}

      {/* Overview Statistics Cards */}
      <FloatingPanel title="Campus Moderation Metrics" className="shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-mocha-900/80 rounded-xl p-4 text-center border border-mocha-700">
            <p className="text-3xl text-lavender-300 font-bold font-mono">
              {loading ? '—' : stats.activeAccounts}
            </p>
            <p className="text-xs text-platinum-500 uppercase tracking-wide mt-1">Active Accounts</p>
          </div>
          <div className="bg-mocha-900/80 rounded-xl p-4 text-center border border-mocha-700">
            <p className="text-3xl text-signal-300 font-bold font-mono">
              {loading ? '—' : stats.reportsToReview}
            </p>
            <p className="text-xs text-platinum-500 uppercase tracking-wide mt-1">Open Reports</p>
          </div>
          <div className="bg-mocha-900/80 rounded-xl p-4 text-center border border-mocha-700">
            <p className="text-3xl text-amber-300 font-bold font-mono">
              {loading ? '—' : stats.claimsToReview}
            </p>
            <p className="text-xs text-platinum-500 uppercase tracking-wide mt-1">Pending Claims</p>
          </div>
        </div>
      </FloatingPanel>

      {/* Reports Moderation Queue */}
      <FloatingPanel title="Reports Queue">
        <div className="overflow-x-auto">
          {reports.length === 0 ? (
            <p className="text-xs text-platinum-500 py-6 text-center">No reports in directory.</p>
          ) : (
            <table className="w-full text-left text-xs text-platinum-400">
              <thead className="text-[11px] text-platinum-500 uppercase bg-mocha-900/70 border-b border-mocha-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title & Category</th>
                  <th className="px-4 py-3 font-semibold">Reporter</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mocha-800">
                {reports.map((r) => {
                  const isRemoved = r.status === 'REMOVED';
                  return (
                    <tr key={r.id} className="hover:bg-mocha-800/30 transition">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-platinum-300 block">{r.title}</span>
                        <span className="text-[10px] text-platinum-500">{r.category} · {r.reportType}</span>
                      </td>
                      <td className="px-4 py-3 text-platinum-400">
                        {r.reporter?.displayName || 'Anonymous'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRemoved ? 'bg-red-500/20 text-red-300' : 'bg-signal-500/20 text-signal-300'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {isRemoved ? (
                          <button
                            type="button"
                            onClick={() => handleReportAction(r.id, 'RESTORE')}
                            className="text-signal-400 hover:text-signal-300 text-xs font-medium"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReportAction(r.id, 'REMOVE')}
                            className="text-red-400 hover:text-red-300 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </FloatingPanel>

      {/* Claims Queue */}
      <FloatingPanel title="Ownership Claims Queue">
        <div className="overflow-x-auto">
          {claims.length === 0 ? (
            <p className="text-xs text-platinum-500 py-6 text-center">No submitted claims to review.</p>
          ) : (
            <table className="w-full text-left text-xs text-platinum-400">
              <thead className="text-[11px] text-platinum-500 uppercase bg-mocha-900/70 border-b border-mocha-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Target Item</th>
                  <th className="px-4 py-3 font-semibold">Claimant</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mocha-800">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-mocha-800/30 transition">
                    <td className="px-4 py-3 font-medium text-platinum-300">
                      {c.report?.title || c.reportId}
                    </td>
                    <td className="px-4 py-3 text-platinum-400">
                      {c.claimant?.displayName || c.claimant?.email || 'Claimant'}
                    </td>
                    <td className="px-4 py-3 text-platinum-500 max-w-xs truncate">
                      {c.message}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lavender-500/20 text-lavender-300">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </FloatingPanel>

      {/* Moderation Audit Log */}
      <FloatingPanel title="Moderation Audit Log">
        <div className="overflow-x-auto">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-platinum-500 py-6 text-center">No audit trail records yet.</p>
          ) : (
            <table className="w-full text-left text-xs text-platinum-400">
              <thead className="text-[11px] text-platinum-500 uppercase bg-mocha-900/70 border-b border-mocha-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mocha-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-mocha-800/30 transition">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-signal-300">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-platinum-300">
                      {log.actor?.displayName || log.actor?.email || 'System'}
                    </td>
                    <td className="px-4 py-3 text-platinum-500 font-mono text-[11px]">
                      {log.targetType}: {log.targetId ? log.targetId.slice(0, 8) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-platinum-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}
