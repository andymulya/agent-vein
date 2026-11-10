/** Collapsible rule block (native details/summary). */
export default function RuleAccordion({ title, children }) {
  return (
    <details className="mb-4 border-2 border-line bg-panel shadow-[6px_6px_0_rgba(0,0,0,0.4)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-ui text-[0.95rem] font-bold tracking-wide [&::-webkit-details-marker]:hidden">
        {title}
        <span className="font-num text-[1.4rem] leading-none text-blood">+</span>
      </summary>
      <div className="px-4 pb-4 text-[0.93rem] text-mut [&_b]:text-ink [&_li]:my-1 [&_ul]:my-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </details>
  );
}
