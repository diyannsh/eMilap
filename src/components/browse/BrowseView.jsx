import FloatingPanel from '../ui/FloatingPanel.jsx';
import { MapPin, Search } from '../../lib/icons.js';

const sampleReports = [
  { status: 'FOUND', item: 'Wireless earbuds', details: 'White charging case; found beside the library study area.', place: 'Library' },
  { status: 'LOST', item: 'Black backpack', details: 'Backpack with a front zip pocket and a water bottle sleeve.', place: 'Student Union' },
  { status: 'FOUND', item: 'Graphing calculator', details: 'Calculator left behind in a classroom after a lecture.', place: 'Engineering Quad' },
];

const BrowseView = () => (
  <div className="w-full max-w-5xl mx-auto pointer-events-none flex flex-col gap-8">
    <div className="flex gap-4 pointer-events-auto">
      <div className="flex-1 bg-mocha-900/80 backdrop-blur-md rounded-xl p-2 border border-mocha-700 flex items-center px-4">
        <Search className="text-platinum-500 mr-3" size={20} />
        <input type="text" aria-label="Search listings" placeholder="Search by item, color, or campus location" className="bg-transparent border-none outline-none text-platinum-500 w-full" />
      </div>
      <button type="button" className="px-6 bg-mocha-800 border border-mocha-700 rounded-xl text-platinum-500 hover:bg-mocha-700 transition">Filters</button>
    </div>

    <FloatingPanel title="Example campus listings">
      <p className="mb-4 text-sm text-platinum-500/75">These sample reports show the kind of details that can help identify an item.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleReports.map((report) => (
          <article key={report.item} className="p-4 rounded-xl bg-mocha-800/50 border border-mocha-700 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-xs px-2 py-1 rounded bg-mocha-900 font-medium text-lavender-300">{report.status} · SAMPLE</span>
            </div>
            <h4 className="text-platinum-400 font-medium">{report.item}</h4>
            <p className="text-platinum-500 text-sm">{report.details}</p>
            <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-platinum-500">
              <MapPin size={12} /> {report.place}
            </div>
          </article>
        ))}
      </div>
    </FloatingPanel>
  </div>
);

export default BrowseView;
