import FloatingPanel from './FloatingPanel.jsx';
import { Package } from '../../lib/icons.js';

const EmptyPlaceholder = ({ title }) => (
  <div className="w-full max-w-2xl mx-auto mt-4">
    <FloatingPanel title={title}>
      <div className="flex flex-col items-center justify-center py-12 text-[#E5E4E2]">
        <span className="p-4 rounded-full bg-[#140C08] border border-[#6F4E37]/50 mb-4 text-[#E6E0F0]">
          <Package size={36} />
        </span>
        <p className="text-base font-semibold text-[#FAF9F8]">No {title.toLowerCase()} right now</p>
        <p className="text-sm text-[#E5E4E2]/70 mt-1 max-w-md text-center">
          New updates and items will automatically appear here when relevant campus activity occurs.
        </p>
      </div>
    </FloatingPanel>
  </div>
);

export default EmptyPlaceholder;
