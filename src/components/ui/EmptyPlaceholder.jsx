import FloatingPanel from './FloatingPanel.jsx';
import { Package } from '../../lib/icons.js';

const EmptyPlaceholder = ({ title }) => (
  <div className="w-full max-w-2xl mx-auto mt-8 pointer-events-none">
     <FloatingPanel title={title} className="pointer-events-auto">
        <div className="flex flex-col items-center justify-center h-48 text-platinum-500">
          <Package size={48} className="mb-4 opacity-20" />
          <p>This area is not available yet. Check back for more lost-and-found tools.</p>
        </div>
     </FloatingPanel>
  </div>
);

export default EmptyPlaceholder;
