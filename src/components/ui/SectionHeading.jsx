import { Reveal } from "./Reveal";

/**
 * Shared section heading: eyebrow with keyline, editorial title and optional
 * supporting copy. Keeps the vertical rhythm identical across sections.
 */
export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "center",
  id,
  className = "",
  children,
}) {
  const centered = align === "center";

  return (
    <Reveal
      className={`${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"} ${className}`}
    >
      <p className={`eyebrow ${centered ? "justify-center" : ""}`}>
        <span className="gold-rule" aria-hidden="true" />
        {eyebrow}
        {centered && <span className="gold-rule" aria-hidden="true" />}
      </p>
      <h2 id={id} className="mt-5 font-serif text-[2.15rem] font-light leading-[1.05] text-cream sm:text-5xl lg:text-[3.4rem]">
        {title}
      </h2>
      {copy && (
        <p className={`mt-5 text-[15px] leading-relaxed text-sand sm:text-base ${centered ? "mx-auto" : ""}`}>
          {copy}
        </p>
      )}
      {children}
    </Reveal>
  );
}

export default SectionHeading;
