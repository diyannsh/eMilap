import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Bell, CheckCheck, CheckCircle2, Clock, Info } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UpdatesView() {
  const { user, setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.list();
      const list = res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.readAt).length);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setLoading(false);
      setNotifications([]);
    }
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((curr) =>
        curr.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      alert(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((curr) =>
        curr.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <FloatingPanel title="Updates & Notifications">
          <div className="py-12 text-center text-platinum-400 space-y-3">
            <Bell size={32} className="mx-auto text-lavender-400" />
            <p className="font-semibold text-lg">Sign-in Required</p>
            <p className="text-xs text-platinum-500 max-w-md mx-auto">
              Sign in to view real-time updates regarding your lost and found reports and ownership claims.
            </p>
          </div>
        </FloatingPanel>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
      <FloatingPanel title="Activity Updates">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-platinum-500">
            Real notifications for matching suggestions and claim activity.
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-signal-400 hover:text-signal-300 flex items-center gap-1 transition"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-platinum-500/70 text-xs">
            Loading updates...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-platinum-500/80 space-y-2">
            <Bell size={28} className="mx-auto text-platinum-600" />
            <p className="font-semibold text-platinum-400 text-sm">No updates yet</p>
            <p className="text-xs text-platinum-500 max-w-sm mx-auto">
              When someone submits a claim for one of your reports or matches are discovered, you will receive updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isUnread = !n.readAt;
              const payload = n.payload || {};
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                    isUnread
                      ? 'bg-mocha-800/80 border-lavender-500/60 shadow'
                      : 'bg-mocha-900/40 border-mocha-700/50 opacity-80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-mocha-900 border border-mocha-700 text-lavender-300">
                        {n.kind.replace(/_/g, ' ')}
                      </span>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-signal-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-platinum-300">
                      {payload.message || `Update for: ${payload.reportTitle || 'Report'}`}
                    </p>
                    {payload.reportTitle && (
                      <p className="text-[11px] text-platinum-500">
                        Item: <span className="text-platinum-400">{payload.reportTitle}</span>
                        {payload.decision && ` · Decision: ${payload.decision}`}
                      </p>
                    )}
                    <span className="text-[10px] text-platinum-500/70 font-mono block pt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="px-2.5 py-1 rounded bg-mocha-800 hover:bg-mocha-700 text-platinum-400 text-[11px] font-medium shrink-0 transition"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </FloatingPanel>
    </div>
  );
}
