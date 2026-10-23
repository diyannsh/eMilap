const FloatingPanel = ({ title, children, className = '', right = false, center = false }) => (
  <section
    className={`pointer-events-auto min-w-0 rounded-2xl border border-[#E5E4E2]/15 bg-[#1B110C]/85 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/45 ${
      right ? 'ml-auto' : ''
    } ${center ? 'mx-auto' : ''} ${className}`}
  >
    <header className="mb-6 flex items-center gap-3.5 border-b border-[#E5E4E2]/12 pb-4">
      <span className="h-6 w-1 rounded-full bg-[#E6E0F0]" aria-hidden="true" />
      <h2 className="text-xl font-semibold tracking-tight text-[#FAF9F8]">{title}</h2>
    </header>
    <div className="min-w-0">{children}</div>
  </section>
);

export default FloatingPanel;
