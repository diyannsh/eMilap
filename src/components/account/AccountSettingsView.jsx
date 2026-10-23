import { useState } from 'react';
import FloatingPanel from '../ui/FloatingPanel.jsx';

const preferences = [
  ['matchUpdates', 'Possible match updates', 'Let me know when a report may match one of mine.'],
  ['claimUpdates', 'Ownership claim updates', 'Show updates when a claim needs review.'],
];

export default function AccountSettingsView() {
  const [enabled, setEnabled] = useState({ matchUpdates: true, claimUpdates: true });
  const [message, setMessage] = useState('');

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2">
      <FloatingPanel title="Profile Details">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage('Profile settings saved locally.');
          }}
        >
          <label className="grid gap-2 text-sm font-medium text-[#E5E4E2]">
            Full Name
            <input
              className="rounded-xl border border-[#6F4E37]/50 bg-[#140C08]/80 px-4 py-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 outline-none transition focus:border-[#E6E0F0] focus:ring-1 focus:ring-[#E6E0F0]/40"
              name="name"
              placeholder="Your full name"
              autoComplete="name"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#E5E4E2]">
            Campus Email
            <input
              className="rounded-xl border border-[#6F4E37]/50 bg-[#140C08]/80 px-4 py-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 outline-none transition focus:border-[#E6E0F0] focus:ring-1 focus:ring-[#E6E0F0]/40"
              name="email"
              type="email"
              placeholder="you@campus.edu"
              autoComplete="email"
            />
          </label>
          <p className="text-xs leading-relaxed text-[#E5E4E2]/70">
            Profile details are used to verify ownership claims and deliver status notifications.
          </p>
          <button
            className="w-full rounded-xl border border-[#E5E4E2]/20 bg-[#6F4E37] px-4 py-3.5 font-semibold text-[#FAF9F8] transition hover:bg-[#8C5E43] shadow-lg"
            type="submit"
          >
            Save profile
          </button>
        </form>
      </FloatingPanel>

      <FloatingPanel title="Notification Preferences">
        <div className="grid gap-4">
          {preferences.map(([key, label, description]) => (
            <label
              key={key}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#6F4E37]/45 bg-[#140C08]/75 p-4 transition hover:border-[#6F4E37]/75"
            >
              <span>
                <span className="block font-semibold text-[#FAF9F8]">{label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[#E5E4E2]/75">{description}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-[#6F4E37] cursor-pointer"
                checked={enabled[key]}
                onChange={(event) => {
                  setEnabled((current) => ({ ...current, [key]: event.target.checked }));
                  setMessage('Notification preference updated.');
                }}
              />
            </label>
          ))}
        </div>
      </FloatingPanel>

      {message && (
        <p className="md:col-span-2 rounded-xl border border-[#6F4E37]/60 bg-[#1B110C]/90 px-5 py-3.5 text-sm text-[#E6E0F0]" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
