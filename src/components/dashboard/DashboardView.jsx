import FloatingPanel from '../ui/FloatingPanel.jsx';
import { AlertCircle, AlertTriangle, CheckCircle, FileSearch } from '../../lib/icons.js';

const DashboardView = ({ setView }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto mt-8 pointer-events-none">
    <FloatingPanel title="Welcome to eMilap" className="h-64 col-span-1 md:col-span-2 pointer-events-auto">
      <div className="flex flex-col h-full justify-between">
        <p className="text-platinum-500">Report a lost item, list something you found, and review possible matches across campus.</p>
        <div className="flex gap-4 mt-6">
          <button onClick={() => setView('report_lost')} className="flex-1 bg-mocha-800 hover:bg-mocha-700 text-platinum-500 py-3 rounded-xl flex items-center justify-center gap-2 border border-mocha-700 transition">
            <AlertCircle size={18} /> Report a lost item
          </button>
          <button onClick={() => setView('report_found')} className="flex-1 bg-signal-500 hover:bg-signal-400 text-[#111113] py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-black/20 transition">
            <CheckCircle size={18} /> Report a found item
          </button>
        </div>
      </div>
    </FloatingPanel>

    <FloatingPanel title="Action Items" className="h-64 pointer-events-auto">
      <ul className="space-y-4">
        <li className="flex items-center gap-3 p-3 rounded-lg bg-lavender-900/20 border border-lavender-800/30 cursor-pointer hover:bg-lavender-900/40 transition">
          <div className="p-2 bg-lavender-500/20 rounded-full text-lavender-300"><FileSearch size={16} /></div>
          <div>
            <p className="text-sm text-platinum-500 font-medium">Example possible match</p>
            <p className="text-xs text-platinum-500">A sample listing for a black backpack</p>
          </div>
        </li>
        <li className="flex items-center gap-3 p-3 rounded-lg bg-mocha-900/20 border border-mocha-800/30 cursor-pointer hover:bg-mocha-900/40 transition">
          <div className="p-2 bg-platinum-500/20 rounded-full text-platinum-500"><AlertTriangle size={16} /></div>
          <div>
            <p className="text-sm text-platinum-500 font-medium">Example ownership claim</p>
            <p className="text-xs text-platinum-500">A sample claim is ready for review</p>
          </div>
        </li>
      </ul>
    </FloatingPanel>
  </div>
);

export default DashboardView;
