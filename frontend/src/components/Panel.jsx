/** Bordered panel with an optional header row. */
export default function Panel({ title, head, children, className = "" }) {
  return (
    <div className={`min-w-0 border-2 border-line bg-panel shadow-[8px_8px_0_rgba(0,0,0,0.5)] max-[640px]:shadow-[5px_5px_0_rgba(0,0,0,0.5)] ${className}`}>
      {(title || head) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line bg-panel3 px-4 py-3 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-2 max-[640px]:px-3">
          {title && (
            <h3 className="m-0 font-ui text-base font-bold tracking-wide">
              {title}
            </h3>
          )}
          {head}
        </div>
      )}
      <div className="p-4 max-[640px]:p-3">{children}</div>
    </div>
  );
}
