import FloatingPanel from '../ui/FloatingPanel.jsx';
import { CheckCircle, FileSearch } from '../../lib/icons.js';

const MatchesView = () => (
  <div className="w-full max-w-4xl mx-auto flex flex-col">
    <FloatingPanel title="Possible Matches">
      <p className="mb-5 text-sm text-[#E5E4E2]/75">Compare item descriptions, categories, colors, and campus locations before starting a claim.</p>
      <div className="space-y-4">
        <article className="p-5 rounded-xl bg-[#140C08]/80 border border-[#6F4E37]/70 flex flex-col md:flex-row gap-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#E6E0F0]/10 rounded-bl-full blur-2xl pointer-events-none" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2 text-[#E6E0F0] text-sm font-semibold tracking-wide">
              <CheckCircle size={16} /> Potential Match Identified
            </div>
            <h3 className="text-lg font-semibold text-[#FAF9F8]">Found item: black backpack</h3>
            <p className="text-sm text-[#E5E4E2]/80">Sample listing from the Student Union area.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-[#1E130E] border border-[#6F4E37]/50 text-[#E5E4E2] px-2.5 py-1 rounded">Description may be similar</span>
              <span className="text-xs bg-[#1E130E] border border-[#6F4E37]/50 text-[#E5E4E2] px-2.5 py-1 rounded">Category: bags</span>
              <span className="text-xs bg-[#1E130E] border border-[#6F4E37]/50 text-[#E5E4E2] px-2.5 py-1 rounded">Color: black</span>
            </div>
          </div>
          <div className="flex flex-row md:flex-col gap-2.5 justify-center shrink-0">
            <button type="button" className="flex-1 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] px-6 py-2.5 rounded-lg text-sm font-semibold border border-[#E5E4E2]/20 shadow-md transition">
              Review claim
            </button>
            <button type="button" className="flex-1 bg-[#241611] hover:bg-[#331F18] text-[#E5E4E2] border border-[#6F4E37]/50 px-6 py-2.5 rounded-lg text-sm transition">
              Not a match
            </button>
          </div>
        </article>

        <article className="p-5 rounded-xl bg-[#140C08]/55 border border-[#6F4E37]/40 flex flex-col md:flex-row gap-6 transition hover:border-[#6F4E37]/60">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2 text-[#E5E4E2]/80 text-sm font-medium">
              <FileSearch size={16} className="text-[#E6E0F0]" /> Related Report
            </div>
            <h3 className="text-lg font-semibold text-[#FAF9F8]">Found item: black bag</h3>
            <p className="text-sm text-[#E5E4E2]/80">Sample listing near the Library. Compare its details with your report.</p>
          </div>
          <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
            <button type="button" className="flex-1 bg-[#2C1C16] hover:bg-[#3D261E] text-[#E5E4E2] border border-[#6F4E37]/50 px-6 py-2.5 rounded-lg text-sm font-medium transition">
              View details
            </button>
          </div>
        </article>
      </div>
    </FloatingPanel>
  </div>
);

export default MatchesView;
