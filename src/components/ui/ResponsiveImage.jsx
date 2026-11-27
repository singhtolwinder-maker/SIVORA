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
    </picture>
  );
}

export default ResponsiveImage;
