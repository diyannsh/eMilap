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
    <div className="mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-2">
      <FloatingPanel title="Profile details">
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); setMessage('Profile settings are ready to connect to the backend. Nothing was saved.'); }}>
          <label className="grid gap-2 text-sm text-platinum-400">
            Name
            <input className="rounded-xl border border-mocha-700 bg-mocha-950/70 px-4 py-3 text-platinum-400 outline-none focus:border-lavender-400" name="name" placeholder="Your name" autoComplete="name" />
          </label>
          <label className="grid gap-2 text-sm text-platinum-400">
            Campus email
            <input className="rounded-xl border border-mocha-700 bg-mocha-950/70 px-4 py-3 text-platinum-400 outline-none focus:border-lavender-400" name="email" type="email" placeholder="you@campus.edu" autoComplete="email" />
          </label>
          <p className="text-xs leading-relaxed text-platinum-500">Profile details will be stored with your account after backend authentication is connected.</p>
          <button className="w-full rounded-xl border border-[#b79ad6]/60 bg-[#8763ad] px-4 py-3 font-semibold text-white transition hover:bg-[#9671bd]" type="submit">Save profile</button>
        </form>
      </FloatingPanel>

      <FloatingPanel title="Notification preferences">
        <div className="grid gap-4">
          {preferences.map(([key, label, description]) => (
            <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-mocha-700/70 bg-mocha-900/30 p-4">
              <span>
                <span className="block font-medium text-platinum-400">{label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-platinum-500">{description}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-[#a282c7]"
                checked={enabled[key]}
                onChange={(event) => {
                  setEnabled((current) => ({ ...current, [key]: event.target.checked }));
                  setMessage('Preference preview changed locally. It is not saved yet.');
                }}
              />
            </label>
          ))}
        </div>
      </FloatingPanel>

      {message && <p className="md:col-span-2 rounded-xl border border-[#b79ad6]/20 bg-[#8763ad]/10 px-4 py-3 text-sm text-platinum-400" role="status">{message}</p>}
    </div>
  );
}
