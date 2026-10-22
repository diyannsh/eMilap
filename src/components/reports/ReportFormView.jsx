import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Eye, Lock } from '../../lib/icons.js';

const ReportFormView = ({ type }) => (
  <div className="w-full max-w-2xl mx-auto pointer-events-none flex flex-col">
    <FloatingPanel title={`Report ${type === 'lost' ? 'Lost' : 'Found'} Item`} className="pointer-events-auto">
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-platinum-500 uppercase tracking-wider flex items-center gap-2">
            <Eye size={16} /> Public Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-platinum-500 mb-1">Item name</label>
              <input type="text" placeholder="Example: blue water bottle" className="w-full bg-mocha-800 border border-mocha-700 rounded-lg p-3 text-platinum-500 focus:outline-none focus:border-lavender-500 transition" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-platinum-500 mb-1">Visible description</label>
              <textarea placeholder="Describe its appearance, brand, or other visible details." className="w-full bg-mocha-800 border border-mocha-700 rounded-lg p-3 text-platinum-500 h-24 focus:outline-none focus:border-lavender-500 transition"></textarea>
            </div>
            <div>
              <label className="block text-sm text-platinum-500 mb-1">Category</label>
              <select className="w-full bg-mocha-800 border border-mocha-700 rounded-lg p-3 text-platinum-500 focus:outline-none focus:border-lavender-500 transition">
                <option>Electronics</option><option>Water Bottles</option><option>Bags</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-platinum-500 mb-1">Main color</label>
              <input type="text" placeholder="Example: blue" className="w-full bg-mocha-800 border border-mocha-700 rounded-lg p-3 text-platinum-500 focus:outline-none focus:border-lavender-500 transition" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-mocha-800/50 rounded-xl border border-mocha-700/50 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-platinum-500"></div>
          <h3 className="text-sm font-medium text-platinum-500 uppercase tracking-wider flex items-center gap-2">
            <Lock size={16} /> Private Ownership Clues
          </h3>
          <p className="text-xs text-platinum-500 leading-relaxed">
            Add a detail that can help confirm the item is yours. Keep it out of the public description, such as a hidden mark, a unique contents detail, or a distinctive scratch.
          </p>
          <textarea placeholder="Add a private detail that only the owner would know." className="w-full bg-mocha-900/50 border border-mocha-700 rounded-lg p-3 text-platinum-500 h-20 focus:outline-none focus:border-platinum-500 transition"></textarea>
        </div>

        <button className="w-full bg-lavender-600 hover:bg-lavender-500 text-white font-medium py-4 rounded-xl shadow-lg transition">
          {type === 'lost' ? 'Submit lost-item report' : 'Submit found-item report'}
        </button>
      </form>
    </FloatingPanel>
  </div>
);

export default ReportFormView;
