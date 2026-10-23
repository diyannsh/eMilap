import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Check, Clock, Fingerprint, Lock, X } from '../../lib/icons.js';

const ClaimsView = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl mx-auto pointer-events-none">
    <FloatingPanel title="Example claims" className="col-span-1 hidden md:block">
      <div className="space-y-2">
        <div className="p-3 bg-mocha-800 rounded-lg border-l-2 border-platinum-500 cursor-pointer">
          <p className="text-sm text-platinum-500">Example claim</p>
          <p className="text-xs text-platinum-500">Found item: graphing calculator</p>
          <span className="inline-block mt-2 text-[10px] uppercase bg-platinum-500/20 text-platinum-500 px-2 py-1 rounded">Example status</span>
        </div>
      </div>
    </FloatingPanel>
    
    <FloatingPanel title="Example claim review" className="col-span-1 md:col-span-2">
      <div className="flex flex-col">
        <div className="bg-mocha-800/50 rounded-xl p-4 border border-mocha-700 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg text-platinum-400">Claim for a graphing calculator</h3>
              <p className="text-sm text-platinum-500">Example claimant</p>
            </div>
            <div className="bg-mocha-900 px-3 py-1 rounded border border-mocha-700 text-xs text-platinum-500 flex items-center gap-2">
              <Clock size={12}/> Sample submission
            </div>
          </div>
          
          <hr className="border-mocha-700" />
          
          <div>
            <h4 className="text-sm font-medium text-platinum-500 mb-2 flex items-center gap-2"><Lock size={14}/> Private ownership detail · example</h4>
            <div className="p-3 bg-mocha-900 rounded-lg text-sm text-platinum-500 font-mono">
              “A small scratch is on the top-right corner, and initials are written inside the battery cover.”
            </div>
          </div>

          <div>
             <h4 className="text-sm font-medium text-platinum-500 mb-2 flex items-center gap-2"><Fingerprint size={14}/> Example review note</h4>
             <div className="p-3 bg-mocha-900 rounded-lg text-sm text-platinum-500">
              “The private detail matches the one in the original report.”
             </div>
          </div>
        </div>

        <div className="mt-auto pt-6 flex gap-3">
          <button className="flex-1 bg-signal-500 hover:bg-signal-400 text-[#111113] py-3 rounded-xl shadow transition font-medium flex justify-center items-center gap-2">
            <Check size={18}/> Approve claim
          </button>
          <button className="flex-1 bg-mocha-800 hover:bg-mocha-700 text-platinum-500 py-3 rounded-xl border border-mocha-600 transition font-medium">
            Request more information
          </button>
          <button className="bg-mocha-900/40 hover:bg-mocha-900/60 text-lavender-300 px-6 py-3 rounded-xl border border-mocha-900/50 transition font-medium flex justify-center items-center">
            <X size={18}/> Reject
          </button>
        </div>
      </div>
    </FloatingPanel>
  </div>
);

export default ClaimsView;
