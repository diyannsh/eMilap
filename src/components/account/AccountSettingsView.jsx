import { useEffect, useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Building2, Check, LogOut, ShieldCheck, User, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';

export default function AccountSettingsView() {
  const { user, logout, refresh } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState({
    matchUpdates: true,
    claimUpdates: true,
  });

  useEffect(() => {
    let mounted = true;
    api.communities.list()
      .then((res) => {
        if (mounted && res?.data) {
          setCommunities(res.data);
          if (user?.communityId) {
            setSelectedCommunity(user.communityId);
          } else if (res.data.length > 0) {
            setSelectedCommunity(res.data[0].id);
          }
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    if (!selectedCommunity) return;
    setLoading(true);
    setMessage('');
    try {
      await api.communities.join(selectedCommunity);
      await refresh();
      setMessage('Active campus community updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Failed to update community: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <FloatingPanel title="Account Settings">
          <div className="py-12 text-center text-[#E5E4E2]/70 space-y-3">
            <User size={36} className="mx-auto text-[#E6E0F0]" />
            <p className="font-semibold text-lg text-[#FAF9F8]">Sign-in Required</p>
            <p className="text-xs text-[#E5E4E2]/60 max-w-md mx-auto">
              Please sign in using the top-right menu to view your profile details, manage memberships, and review notifications.
            </p>
          </div>
        </FloatingPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-2">
      {/* Profile Details Panel */}
      <FloatingPanel title="Profile Details">
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-[#E5E4E2]/60 mb-1">Display Name</label>
            <input
              disabled
              value={user.displayName || ''}
              className="w-full rounded-xl border border-[#6F4E37]/50 bg-[#140C08]/80 px-4 py-2.5 text-xs text-[#FAF9F8] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-[#E5E4E2]/60 mb-1">Campus Email</label>
            <input
              disabled
              value={user.email || ''}
              className="w-full rounded-xl border border-[#6F4E37]/50 bg-[#140C08]/80 px-4 py-2.5 text-xs text-[#FAF9F8] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[#100805] rounded-xl border border-[#6F4E37]/40">
              <span className="text-[10px] uppercase font-bold text-[#E5E4E2]/60 block">Account Role</span>
              <span className="text-sm font-semibold text-[#C68B59] mt-0.5 flex items-center gap-1">
                <ShieldCheck size={14} /> {user.role || 'MEMBER'}
              </span>
            </div>
            <div className="p-3 bg-[#100805] rounded-xl border border-[#6F4E37]/40">
              <span className="text-[10px] uppercase font-bold text-[#E5E4E2]/60 block">Active Community</span>
              <span className="text-sm font-semibold text-[#E6E0F0] mt-0.5 truncate block">
                {user.communityName || 'Not selected'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full mt-2 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 px-4 py-2.5 text-xs font-semibold text-red-300 transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} /> Sign out of eMilap
          </button>
        </div>
      </FloatingPanel>

      {/* Community Membership Controls */}
      <FloatingPanel title="Campus Community Membership">
        <form onSubmit={handleJoinCommunity} className="space-y-4">
          <p className="text-xs text-[#E5E4E2]/70 leading-relaxed">
            Choose which campus community or hostel directory you belong to. Reports, matches, and notifications are scoped to your active community.
          </p>

          <div>
            <label className="block text-xs uppercase font-semibold text-[#E5E4E2]/60 mb-1">
              Select Campus Community
            </label>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full rounded-xl border border-[#6F4E37]/50 bg-[#140C08] px-4 py-2.5 text-xs text-[#FAF9F8] outline-none focus:border-[#E6E0F0]"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#140C08]">
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || selectedCommunity === user.communityId}
            className="w-full rounded-xl bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] py-2.5 px-4 font-bold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow"
          >
            <Check size={14} /> {selectedCommunity === user.communityId ? 'Current Active Community' : 'Switch Active Community'}
          </button>

          {message && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-300">
              {message}
            </p>
          )}
        </form>
      </FloatingPanel>
    </div>
  );
}
