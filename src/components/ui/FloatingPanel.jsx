const FloatingPanel = ({ title, children, className = '', right = false, center = false }) => (
  <section className={`pointer-events-auto min-w-0 ${right ? 'ml-auto' : ''} ${center ? 'mx-auto' : ''} ${className}`}>
    <header className="mb-5 flex items-center gap-4 border-b border-mocha-700/70 pb-4">
      <span className="h-7 w-1 rounded-full bg-lavender-300" aria-hidden="true" />
      <h2 className="text-xl font-semibold tracking-tight text-platinum-400">{title}</h2>
    </header>
    <div className="min-w-0 pb-3">{children}</div>
  </section>
);

export default FloatingPanel;
