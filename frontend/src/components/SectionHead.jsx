/** Section heading: pixel title + small tag line. */
export default function SectionHead({ title, tag }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline gap-4">
      <h2
        className="m-0 font-disp text-[clamp(1rem,3.6vw,1.45rem)] text-white max-[640px]:leading-relaxed"
        style={{ textShadow: "3px 3px 0 #a30f2c" }}
      >
        {title}
      </h2>
      {tag && (
        <span className="font-ui text-[0.75rem] tracking-wide text-dim">
          {tag}
        </span>
      )}
    </div>
  );
}
