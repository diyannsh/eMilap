import FloatingPanel from '../ui/FloatingPanel.jsx';

const AdminView = () => (
  <div className="w-full max-w-5xl mx-auto pointer-events-none flex flex-col gap-10">
    <FloatingPanel title="Moderation overview · sample layout" className="pointer-events-auto shrink-0">
       <div className="flex gap-4">
         <div className="flex-1 bg-mocha-800 rounded-lg p-4 text-center border border-mocha-700">
           <p className="text-3xl text-lavender-300 font-light">—</p>
           <p className="text-xs text-platinum-500 uppercase tracking-wide mt-1">Active accounts</p>
         </div>
         <div className="flex-1 bg-mocha-800 rounded-lg p-4 text-center border border-mocha-700">
           <p className="text-3xl text-platinum-500 font-light">—</p>
           <p className="text-xs text-platinum-500 uppercase tracking-wide mt-1">Reports to review</p>
         </div>
         <div className="flex-1 bg-mocha-800 rounded-lg p-4 text-center border border-mocha-700">
           <p className="text-3xl text-lavender-300 font-light">—</p>
           <p className="text-xs text-platinum-500 uppercase tracking-wide mt-1">Claims to review</p>
         </div>
       </div>
    </FloatingPanel>

    <FloatingPanel title="Example moderation queue">
      <table className="w-full text-left text-sm text-platinum-500">
        <thead className="text-xs text-platinum-500 uppercase bg-mocha-900/50 border-b border-mocha-700">
          <tr>
            <th className="px-4 py-3 font-medium">Record</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Reporter</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-mocha-800 hover:bg-mocha-800/30">
            <td className="px-4 py-4 font-mono text-xs">Example report</td>
            <td className="px-4 py-4"><span className="px-2 py-1 bg-platinum-500/10 text-platinum-500 rounded text-xs">Needs review</span></td>
            <td className="px-4 py-4">Example reporter</td>
            <td className="px-4 py-4 text-right">
              <button className="text-lavender-300 hover:text-lavender-100 mr-3 text-xs">Review</button>
              <button className="text-lavender-300 hover:text-lavender-100 text-xs">Remove</button>
            </td>
          </tr>
          <tr className="hover:bg-mocha-800/30">
            <td className="px-4 py-4 font-mono text-xs">Example claim</td>
            <td className="px-4 py-4"><span className="px-2 py-1 bg-lavender-700/10 text-lavender-300 rounded text-xs">Ownership check</span></td>
            <td className="px-4 py-4">Example claimant</td>
            <td className="px-4 py-4 text-right">
              <button className="text-lavender-300 hover:text-lavender-100 mr-3 text-xs">Review</button>
              <button className="text-platinum-500 hover:text-platinum-500 text-xs">Ignore</button>
            </td>
          </tr>
        </tbody>
      </table>
    </FloatingPanel>
  </div>
);

export default AdminView;
