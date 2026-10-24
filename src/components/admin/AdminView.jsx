import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Shield, ShieldAlert, Check, X, RefreshCw, FileText, Lock } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminView({ onNavigate }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeAccounts: 0, reportsToReview: 0, claimsToReview: 0 });
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState('');

  const isMod = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  const loadData = async () => {
    setLoading(true);
    setActionFeedback('');
    try {
      const [statsRes, reportsRes, claimsRes, auditRes] = await Promise.allSettled([
        api.admin.stats(),
        api.reports.list({ limit: 10 }),
        api.claims.list(),
        api.admin.auditLogs(15),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (reportsRes.status === 'fulfilled' && reportsRes.value?.data) {
        setReports(reportsRes.value.data);
      }
      if (claimsRes.status === 'fulfilled' && claimsRes.value?.data) {
        setClaims(claimsRes.value.data);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value?.data) {
        setAuditLogs(auditRes.value.data);
      }
    } catch (err) {
      console.warn('Admin data load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMod) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isMod]);

  const handleReportAction = async (reportId, nextStatus) => {
    try {
      await api.reports.updateStatus(reportId, nextStatus);
      setActionFeedback(`Report ${reportId.slice(0, 8)} updated to ${nextStatus}.`);
      setTimeout(() => setActionFeedback(''), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  if (!user || !isMod) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <FloatingPanel title="Moderation & Governance">
          <div className="py-12 text-center text-[#E5E4E2]/70 space-y-3">
            <Lock size={36} className="mx-auto text-[#E6E0F0]" />
            <p className="font-semibold text-lg text-[#FAF9F8]">Moderator Access Required</p>
            <p className="text-xs text-[#E5E4E2]/60 max-w-md mx-auto">
              This area is restricted to campus moderators and administrators. Please sign in with an authorized campus staff account to review reports, audit logs, and claims.
            </p>
          </div>
        </FloatingPanel>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {actionFeedback && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300">
          {actionFeedback}
        </div>
      )}

      {/* Moderation Stat Cards */}
      <FloatingPanel title="Campus Moderation Overview">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate?.('browse')}
            className="p-5 rounded-xl bg-[#140C08]/85 border border-[#6F4E37]/50 shadow cursor-pointer hover:border-[#E6E0F0]/50 transition text-center"
          >
            <p className="text-3xl font-bold text-[#FAF9F8]">{stats.activeAccounts || 0}</p>
            <p className="text-xs text-[#E6E0F0] uppercase tracking-wider font-semibold mt-1">Community Members</p>
          </div>
          <div
            onClick={() => onNavigate?.('browse')}
            className="p-5 rounded-xl bg-[#140C08]/85 border border-[#6F4E37]/50 shadow cursor-pointer hover:border-[#E6E0F0]/50 transition text-center"
          >
            <p className="text-3xl font-bold text-[#C68B59]">{stats.reportsToReview || reports.length}</p>
            <p className="text-xs text-[#E6E0F0] uppercase tracking-wider font-semibold mt-1">Active Reports</p>
          </div>
          <div
            onClick={() => onNavigate?.('claims')}
            className="p-5 rounded-xl bg-[#140C08]/85 border border-[#6F4E37]/50 shadow cursor-pointer hover:border-[#E6E0F0]/50 transition text-center"
          >
            <p className="text-3xl font-bold text-[#E6E0F0]">{stats.claimsToReview || claims.length}</p>
            <p className="text-xs text-[#E6E0F0] uppercase tracking-wider font-semibold mt-1">Claims in Audit</p>
          </div>
        </div>
      </FloatingPanel>

      {/* Reports Queue */}
      <FloatingPanel title="Recent Campus Reports">
        <div className="overflow-x-auto rounded-xl border border-[#6F4E37]/40">
          {reports.length === 0 ? (
            <p className="text-xs text-[#E5E4E2]/60 py-6 text-center">No reports in the queue.</p>
          ) : (
            <table className="w-full text-left text-xs text-[#E5E4E2]">
              <thead className="text-[11px] text-[#E6E0F0] uppercase tracking-wider bg-[#100805] border-b border-[#6F4E37]/40">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Title</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6F4E37]/25 bg-[#140C08]/60">
                {reports.map((r) => {
                  const isRemoved = r.status === 'REMOVED';
                  return (
                    <tr key={r.id} className="hover:bg-[#241611]/50 transition">
                      <td className="px-5 py-4 font-medium text-[#FAF9F8]">{r.title}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.reportType === 'FOUND' ? 'bg-[#C68B59]/20 text-[#C68B59]' : 'bg-[#6F4E37]/40 text-[#E6E0F0]'}`}>
                          {r.reportType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#E5E4E2]/80">{r.category}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#100805] border border-[#6F4E37]/40 text-[#E5E4E2]">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isRemoved ? (
                          <button
                            type="button"
                            onClick={() => handleReportAction(r.id, 'ACTIVE')}
                            className="text-[#C68B59] hover:underline text-xs font-medium"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReportAction(r.id, 'REMOVED')}
                            className="text-rose-400 hover:underline text-xs font-medium"
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

      {/* Moderation Audit Log */}
      <FloatingPanel title="Moderation Audit Log">
        <div className="overflow-x-auto rounded-xl border border-[#6F4E37]/40">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-[#E5E4E2]/60 py-6 text-center">No audit trail records yet.</p>
          ) : (
            <table className="w-full text-left text-xs text-[#E5E4E2]">
              <thead className="text-[11px] text-[#E6E0F0] uppercase tracking-wider bg-[#100805] border-b border-[#6F4E37]/40">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Action</th>
                  <th className="px-5 py-3.5 font-semibold">Actor</th>
                  <th className="px-5 py-3.5 font-semibold">Target</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6F4E37]/25 bg-[#140C08]/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#241611]/50 transition">
                    <td className="px-5 py-4 font-semibold text-[#C68B59]">{log.action}</td>
                    <td className="px-5 py-4 text-[#FAF9F8]">{log.actor?.displayName || log.actor?.email || 'System'}</td>
                    <td className="px-5 py-4 text-[#E5E4E2]/60 font-mono text-[11px]">{log.targetType}: {log.targetId ? log.targetId.slice(0, 8) : '—'}</td>
                    <td className="px-5 py-4 text-right text-[#E5E4E2]/60 font-mono text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
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
