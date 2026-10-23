import { useMemo, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { useMockStore } from '../../data/mockStore.js';
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  FileSearch,
  Inbox,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react';

export default function NotificationsView({ onNavigate }) {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useMockStore();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'MATCHES' | 'CLAIMS' | 'SYSTEM'

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'UNREAD') return !item.read;
      if (activeTab === 'MATCHES') return item.type === 'match';
      if (activeTab === 'CLAIMS') return item.type === 'claim';
      if (activeTab === 'SYSTEM') return item.type === 'system' || item.type === 'report';
      return true;
    });
  }, [notifications, activeTab]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match':
        return <Sparkles size={18} className="text-[#C68B59]" />;
      case 'claim':
        return <CheckCircle size={18} className="text-[#E6E0F0]" />;
      case 'report':
        return <FileSearch size={18} className="text-[#E5E4E2]" />;
      default:
        return <Bell size={18} className="text-[#C68B59]" />;
    }
  };

  const handleAction = (item) => {
    markNotificationRead(item.id);
    if (item.linkView && onNavigate) {
      onNavigate(item.linkView);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* ── Top Header Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#160D09]/80 border border-[#6F4E37]/50 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6F4E37]/30 border border-[#6F4E37]/60 flex items-center justify-center text-[#FAF9F8]">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FAF9F8]">Updates &amp; Alerts</h3>
            <p className="text-xs text-[#E5E4E2]/70">
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="px-3.5 py-2 bg-[#261712] hover:bg-[#341F18] border border-[#6F4E37]/60 text-xs font-semibold text-[#FAF9F8] rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <CheckCheck size={14} className="text-[#C68B59]" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
              className="p-2 hover:bg-[#2C1812] border border-[#6F4E37]/40 text-[#E5E4E2]/60 hover:text-red-300 rounded-xl transition"
              title="Clear all notifications"
              aria-label="Clear all notifications"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: `All (${notifications.length})` },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'MATCHES', label: 'Matches' },
          { id: 'CLAIMS', label: 'Claims' },
          { id: 'SYSTEM', label: 'System & Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-medium tracking-wide transition whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-[#6F4E37] text-[#FAF9F8] border-[#E6E0F0]/50 shadow-md'
                : 'bg-[#140C08]/70 text-[#E5E4E2]/70 border-[#6F4E37]/35 hover:text-[#FAF9F8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notifications List ── */}
      <FloatingPanel title="Notification Feed">
        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
            <Inbox size={40} className="text-[#C68B59]/60" />
            <h4 className="text-base font-semibold text-[#FAF9F8]">No notifications in this view</h4>
            <p className="text-xs text-[#E5E4E2]/70 max-w-sm">
              {activeTab === 'UNREAD'
                ? "You've read all your campus updates and alerts."
                : 'No notifications found for this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <article
                key={notif.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start justify-between ${
                  notif.read
                    ? 'bg-[#120A07]/60 border-[#6F4E37]/30 hover:border-[#6F4E37]/60'
                    : 'bg-[#1B100C]/90 border-[#6F4E37]/80 hover:border-[#E6E0F0]/60 shadow-lg relative'
                }`}
              >
                {!notif.read && (
                  <span className="absolute left-2 top-2 w-2 h-2 rounded-full bg-[#E6E0F0] ring-4 ring-[#E6E0F0]/20" />
                )}

                <div className="flex gap-3.5 items-start flex-1 min-w-0">
                  <div className="mt-1 w-9 h-9 rounded-xl bg-[#241611] border border-[#6F4E37]/50 flex items-center justify-center shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm sm:text-base font-semibold ${notif.read ? 'text-[#FAF9F8]/80' : 'text-[#FAF9F8]'}`}>
                        {notif.title}
                      </h4>
                      {notif.badge && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C68B59]/20 text-[#C68B59] border border-[#C68B59]/35">
                          {notif.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#E5E4E2]/80 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-[#E5E4E2]/50 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {notif.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#6F4E37]/25">
                  {notif.linkView && (
                    <button
                      type="button"
                      onClick={() => handleAction(notif)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-[#E5E4E2]/20 shadow"
                    >
                      {notif.type === 'match'
                        ? 'Review Match'
                        : notif.type === 'claim'
                        ? 'View Claim'
                        : 'Explore'}
                      <ExternalLink size={12} />
                    </button>
                  )}

                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(notif.id)}
                      className="px-3 py-2 text-xs text-[#E5E4E2]/60 hover:text-[#FAF9F8] transition flex items-center gap-1"
                    >
                      <Check size={12} /> Mark read
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </FloatingPanel>
    </div>
  );
}

