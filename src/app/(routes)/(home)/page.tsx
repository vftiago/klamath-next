// The frame neon signs are the visible navigation; these links mirror them for keyboard, screen-reader
// and crawler access. Hidden until a link takes keyboard focus, then the whole nav shows, like a skip link.
const HomePage = () => {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="sr-only">Tiago Fernandes</h1>
      {/* not-sr-only also resets padding, so the panel styles live on an inner element it doesn't touch */}
      <nav aria-label="Site" className="sr-only self-start focus-within:not-sr-only">
        <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-gray-500/10 px-3 py-2 font-mono text-xs tracking-[0.16em] uppercase backdrop-blur-sm">
          <a href="https://dev.to/vftiago" rel="noreferrer" target="_blank">
            Dev.to <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href="https://www.linkedin.com/in/vftiago/" rel="noreferrer" target="_blank">
            LinkedIn <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href="https://github.com/vftiago" rel="noreferrer" target="_blank">
            GitHub <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default HomePage;
