import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Check, Clock, Fingerprint, Lock, X } from '../../lib/icons.js';

const ClaimsView = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
    <FloatingPanel title="Claims" className="col-span-1 hidden md:block">
      <div className="space-y-3">
        <div className="p-4 bg-[#140C08]/90 rounded-xl border-l-2 border-[#E6E0F0] border border-[#6F4E37]/50 cursor-pointer shadow-md">
          <p className="text-sm font-semibold text-[#FAF9F8]">Graphing calculator</p>
          <p className="text-xs text-[#E5E4E2]/70 mt-1">Claimant: Alex M.</p>
          <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-wider bg-[#E6E0F0]/15 text-[#E6E0F0] border border-[#E6E0F0]/30 px-2.5 py-1 rounded">
            Under Review
          </span>
        </div>
      </div>
    </FloatingPanel>

    <FloatingPanel title="Ownership Claim Review" className="col-span-1 md:col-span-2">
      <div className="flex flex-col">
        <div className="bg-[#140C08]/80 rounded-xl p-5 border border-[#6F4E37]/50 space-y-4 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-[#FAF9F8]">Claim for TI-84 Plus CE</h3>
              <p className="text-sm text-[#E5E4E2]/75 mt-0.5">Submitted by Student ID ••••4821</p>
            </div>
            <div className="bg-[#1E130E] px-3 py-1.5 rounded-lg border border-[#6F4E37]/50 text-xs text-[#E6E0F0] flex items-center gap-2">
              <Clock size={13} /> 2 hours ago
            </div>
          </div>

          <hr className="border-[#6F4E37]/30" />

          <div>
            <h4 className="text-sm font-semibold text-[#E6E0F0] mb-2 flex items-center gap-2">
              <Lock size={15} /> Private Ownership Detail
            </h4>
            <div className="p-4 bg-[#100805] rounded-xl text-sm text-[#FAF9F8] font-mono border border-[#6F4E37]/40 leading-relaxed">
              &ldquo;A small scratch is on the top-right corner, and initials &lsquo;A.M.&rsquo; are written inside the battery cover in silver sharpie.&rdquo;
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#E5E4E2] mb-2 flex items-center gap-2">
              <Fingerprint size={15} className="text-[#C68B59]" /> System Verification Match
            </h4>
            <div className="p-4 bg-[#100805] rounded-xl text-sm text-[#E5E4E2]/85 border border-[#6F4E37]/40">
              The private detail matches the secure notes stored with the original found item report.
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="flex-1 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] py-3 px-5 rounded-xl font-semibold shadow-lg transition flex justify-center items-center gap-2 border border-[#E5E4E2]/25"
          >
            <Check size={18} /> Approve claim
          </button>
          <button
            type="button"
            className="flex-1 bg-[#241611] hover:bg-[#331F18] text-[#E5E4E2] py-3 px-5 rounded-xl border border-[#6F4E37]/50 transition font-medium"
          >
            Request more info
          </button>
          <button
            type="button"
            className="bg-[#180E0A] hover:bg-[#281610] text-[#E6E0F0] px-5 py-3 rounded-xl border border-[#6F4E37]/40 transition font-medium flex justify-center items-center gap-1.5"
          >
            <X size={17} /> Reject
          </button>
        </div>
      </div>
    </FloatingPanel>
  </div>
);

export default ClaimsView;
