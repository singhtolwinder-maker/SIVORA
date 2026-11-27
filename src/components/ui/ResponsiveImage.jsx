import manifest from "@/lib/imageManifest.json";

/**
 * Serves the local dish and interior photography as AVIF, then WebP, then the
 * original JPEG, with a width `srcset` so a phone never downloads a 1392 px
 * file for a 480 px slot.
 *
 * The derivative files are generated once and committed (see
 * `scripts/optimize-images.mjs`); the manifest lists the exact widths that
 * exist for each source, so nothing is requested that was never built. Any
 * source not in the manifest — an absolute URL from an admin edit, for
 * example — falls through to a plain `<img>` unchanged.
 */
function buildSrcSet(variants, format) {
  return variants.map((variant) => `${variant[format]} ${variant.width}w`).join(", ");
}

/**
 * A 1×1 transparent SVG, inlined so it costs no request.
 *
 * `<img>` must carry a `src`, and a browser starts fetching it as soon as the
 * element exists — before the `<source>` list is read. Pointing it at the
 * full-size JPEG meant the menu downloaded 13 originals (1.27 MB) *and* the
 * AVIFs it actually displayed. The placeholder keeps that fallback free, and
 * the JPEG is offered as a third `<source>` so a browser without AVIF or WebP
 * still gets the photograph instead of an empty box.
 */
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

export function ResponsiveImage({
  src,
  alt = "",
  sizes = "100vw",
  className = "",
  loading,
  decoding,
  fetchPriority,
  width,
  height,
  ...rest
}) {
  const entry = manifest[src];

  if (!entry) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        {...rest}
      />
    );
  }

  return (
    <picture className="contents">
      <source type="image/avif" srcSet={buildSrcSet(entry.variants, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={buildSrcSet(entry.variants, "webp")} sizes={sizes} />
      <source type="image/jpeg" srcSet={`${src} ${entry.width}w`} sizes={sizes} />
      <img
        src={PLACEHOLDER}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        {...rest}
      />
    </picture>
  );
}

export default ResponsiveImage;
