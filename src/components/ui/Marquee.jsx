/**
 * Infinite press-strip. Two copies of the same list translate by -50% so the
 * loop is seamless; it pauses on hover and for reduced-motion visitors.
 */
export function Marquee({ items, className = "" }) {
  const row = (
    <ul className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex shrink-0 items-center gap-10 sm:gap-14">
          <span className="whitespace-nowrap font-serif text-sm italic tracking-wide text-sand/85 sm:text-base">
            {item}
          </span>
          <span className="size-1 shrink-0 rotate-45 bg-gold/50" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`group relative overflow-hidden border-y border-line bg-coal/40 ${className}`}>
      <div className="mask-fade-x flex w-max animate-marquee-left group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {row}
        <div aria-hidden="true" className="flex">
          {row}
        </div>
      </div>
    </div>
  );
}

export default Marquee;
