import FloatingPanel from '../ui/FloatingPanel.jsx';
import { MapPin, Search } from '../../lib/icons.js';

const sampleReports = [
  { status: 'FOUND', item: 'Wireless earbuds', details: 'White charging case; found beside the library study area.', place: 'Library' },
  { status: 'LOST', item: 'Black backpack', details: 'Backpack with a front zip pocket and a water bottle sleeve.', place: 'Student Union' },
  { status: 'FOUND', item: 'Graphing calculator', details: 'Calculator left behind in a classroom after a lecture.', place: 'Engineering Quad' },
];

const BrowseView = () => (
  <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
    <div className="flex gap-4">
      <div className="flex-1 bg-[#1B110C]/85 backdrop-blur-xl rounded-xl p-2.5 border border-[#6F4E37]/60 flex items-center px-4 focus-within:border-[#E6E0F0] shadow-xl">
        <Search className="text-[#E6E0F0] mr-3 shrink-0" size={20} />
        <input
          type="text"
          aria-label="Search listings"
          placeholder="Search by item, color, or campus location"
          className="bg-transparent border-none outline-none text-[#FAF9F8] placeholder-[#E5E4E2]/40 w-full"
        />
      </div>
      <button
        type="button"
        className="px-6 bg-[#2B1B15] border border-[#6F4E37]/60 rounded-xl text-[#E5E4E2] hover:bg-[#3D261D] hover:border-[#E6E0F0]/50 transition font-medium shadow-xl"
      >
        Filters
      </button>
    </div>

    <FloatingPanel title="Campus Listings">
      <p className="mb-5 text-sm text-[#E5E4E2]/75">These sample reports show the kind of details that can help identify an item.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleReports.map((report) => (
          <article
            key={report.item}
            className="p-5 rounded-xl bg-[#140C08]/75 border border-[#6F4E37]/45 hover:border-[#E6E0F0]/40 flex flex-col gap-2.5 transition shadow-lg"
          >
            <div className="flex justify-between items-start">
              <span
                className={`text-[11px] px-2.5 py-1 rounded font-semibold tracking-wider ${
                  report.status === 'FOUND'
                    ? 'bg-[#C68B59]/20 text-[#C68B59] border border-[#C68B59]/40'
                    : 'bg-[#6F4E37]/35 text-[#E6E0F0] border border-[#6F4E37]/60'
                }`}
              >
                {report.status} · SAMPLE
              </span>
            </div>
            <h4 className="text-[#FAF9F8] font-semibold text-base">{report.item}</h4>
            <p className="text-[#E5E4E2]/80 text-sm leading-relaxed">{report.details}</p>
            <div className="flex items-center gap-2 mt-auto pt-3 text-xs text-[#E6E0F0]/80 border-t border-[#6F4E37]/25">
              <MapPin size={13} className="text-[#E6E0F0]" /> {report.place}
            </div>
          </article>
        ))}
      </div>
    </FloatingPanel>
  </div>
);

export default BrowseView;
