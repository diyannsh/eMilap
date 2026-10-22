import FloatingPanel from '../ui/FloatingPanel.jsx';
import { CheckCircle, FileSearch } from '../../lib/icons.js';

const MatchesView = () => (
  <div className="w-full max-w-4xl mx-auto pointer-events-none flex flex-col">
    <FloatingPanel title="Example possible matches">
      <p className="mb-4 text-sm text-platinum-500/75">Compare item descriptions, categories, colors, and campus locations before starting a claim.</p>
      <div className="space-y-4">
        <article className="p-4 rounded-xl bg-mocha-800/40 border border-lavender-900/50 flex flex-col md:flex-row gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-lavender-500/10 rounded-bl-full blur-xl" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-lavender-300 text-sm font-semibold tracking-wide"><CheckCircle size={16} /> Example match to review</div>
            <h3 className="text-lg text-platinum-400">Found item: black backpack</h3>
            <p className="text-sm text-platinum-500">Sample listing from the Student Union area.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-mocha-900 border border-mocha-700 text-platinum-500 px-2 py-1 rounded">Description may be similar</span>
              <span className="text-xs bg-mocha-900 border border-mocha-700 text-platinum-500 px-2 py-1 rounded">Category: bags</span>
              <span className="text-xs bg-mocha-900 border border-mocha-700 text-platinum-500 px-2 py-1 rounded">Color: black</span>
            </div>
          </div>
          <div className="flex flex-row md:flex-col gap-2 justify-center">
            <button type="button" className="flex-1 bg-lavender-600 hover:bg-lavender-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition">Review claim</button>
            <button type="button" className="flex-1 bg-mocha-800 hover:bg-mocha-700 text-platinum-500 px-6 py-2 rounded-lg text-sm transition">Not a match</button>
          </div>
        </article>

        <article className="p-4 rounded-xl bg-mocha-800/20 border border-mocha-700/50 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-platinum-500 text-sm font-medium"><FileSearch size={16} /> Another example</div>
            <h3 className="text-lg text-platinum-500">Found item: black bag</h3>
            <p className="text-sm text-platinum-500">Sample listing near the Library. Compare its details with your report.</p>
          </div>
          <div className="flex flex-row md:flex-col gap-2 justify-center">
            <button type="button" className="flex-1 bg-mocha-700 hover:bg-mocha-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition">View example</button>
          </div>
        </article>
      </div>
    </FloatingPanel>
  </div>
);

export default MatchesView;
