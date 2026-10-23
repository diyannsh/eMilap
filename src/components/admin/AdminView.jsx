import FloatingPanel from '../ui/FloatingPanel.jsx';

const AdminView = () => (
  <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
    <FloatingPanel title="Moderation Overview" className="shrink-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#140C08]/85 rounded-xl p-5 text-center border border-[#6F4E37]/50 shadow-md">
          <p className="text-3xl text-[#FAF9F8] font-bold">142</p>
          <p className="text-xs text-[#E6E0F0] uppercase tracking-wider font-semibold mt-1.5">Active Campus Reports</p>
        </div>
        <div className="bg-[#140C08]/85 rounded-xl p-5 text-center border border-[#6F4E37]/50 shadow-md">
          <p className="text-3xl text-[#C68B59] font-bold">7</p>
          <p className="text-xs text-[#E6E0F0] uppercase tracking-wider font-semibold mt-1.5">Reports to Review</p>
        </div>
        <div className="bg-[#140C08]/85 rounded-xl p-5 text-center border border-[#6F4E37]/50 shadow-md">
          <p className="text-3xl text-[#E6E0F0] font-bold">3</p>
          <p className="text-xs text-[#E6E0F0] uppercase tracking-wider font-semibold mt-1.5">Claims Pending Audit</p>
        </div>
      </div>
    </FloatingPanel>

    <FloatingPanel title="Moderation Queue">
      <div className="overflow-x-auto rounded-xl border border-[#6F4E37]/40">
        <table className="w-full text-left text-sm text-[#E5E4E2]">
          <thead className="text-xs text-[#E6E0F0] uppercase tracking-wider bg-[#100805] border-b border-[#6F4E37]/40">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Record</th>
              <th className="px-5 py-3.5 font-semibold">Reason</th>
              <th className="px-5 py-3.5 font-semibold">Reporter</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#6F4E37]/25 bg-[#140C08]/60">
            <tr className="hover:bg-[#241611]/50 transition">
              <td className="px-5 py-4 font-mono text-xs text-[#FAF9F8]">AirPods Pro (Case Found)</td>
              <td className="px-5 py-4">
                <span className="px-2.5 py-1 bg-[#6F4E37]/30 text-[#E6E0F0] border border-[#6F4E37]/60 rounded text-xs font-medium">
                  Needs review
                </span>
              </td>
              <td className="px-5 py-4 text-xs text-[#E5E4E2]/80">Campus Security Desk</td>
              <td className="px-5 py-4 text-right">
                <button type="button" className="text-[#E6E0F0] hover:text-[#FAF9F8] font-medium mr-4 text-xs transition">
                  Review
                </button>
                <button type="button" className="text-[#C68B59] hover:text-[#E0AA6F] text-xs transition">
                  Archive
                </button>
              </td>
            </tr>
            <tr className="hover:bg-[#241611]/50 transition">
              <td className="px-5 py-4 font-mono text-xs text-[#FAF9F8]">Blue HydroFlask Claim</td>
              <td className="px-5 py-4">
                <span className="px-2.5 py-1 bg-[#E6E0F0]/15 text-[#E6E0F0] border border-[#E6E0F0]/30 rounded text-xs font-medium">
                  Ownership check
                </span>
              </td>
              <td className="px-5 py-4 text-xs text-[#E5E4E2]/80">Student ••••1192</td>
              <td className="px-5 py-4 text-right">
                <button type="button" className="text-[#E6E0F0] hover:text-[#FAF9F8] font-medium mr-4 text-xs transition">
                  Review
                </button>
                <button type="button" className="text-[#E5E4E2]/50 hover:text-[#E5E4E2] text-xs transition">
                  Dismiss
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </FloatingPanel>
  </div>
);

export default AdminView;
