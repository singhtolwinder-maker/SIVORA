/**
 * Regenerates the responsive image derivatives in `public/images` and the
 * manifest that `src/components/ui/ResponsiveImage.jsx` reads.
 *
 *   npm i --no-save sharp && node scripts/optimize-images.mjs
 *
 * `sharp` is deliberately not a project dependency: the files are generated
 * once and committed, so the Vercel build never needs a native image pipeline.
 * Install it only when the source photography changes, and remove it again
 * afterwards (`npm uninstall --no-save sharp`).
 *
 * For every `public/images/foo.jpg` this writes `foo-<width>.webp` and
 * `foo-<width>.avif` at 480 px, 768 px and the original width (whichever are
 * smaller than the original), and records their real dimensions in
 * `src/lib/imageManifest.json`. The JPEG stays as the `<img>` fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageDir = path.join(root, "public", "images");
const manifestPath = path.join(root, "src", "lib", "imageManifest.json");

const WEBP_QUALITY = 78;
const AVIF_QUALITY = 55;

/** Widths that make sense for the layouts in `src/`: cards, gallery, hero. */
function widthsFor(originalWidth) {
  const widths = [480, 768].filter((width) => width < originalWidth * 0.95);
  widths.push(originalWidth);
  return widths;
}

async function main() {
  const sources = fs
    .readdirSync(imageDir)
    .filter((file) => file.endsWith(".jpg"))
    .sort();

  if (sources.length === 0) throw new Error(`No JPEG sources in ${imageDir}`);

  const manifest = {};
  let written = 0;

  for (const file of sources) {
    const source = path.join(imageDir, file);
    const base = file.replace(/\.jpg$/, "");
    const { width: originalWidth, height } = await sharp(source).metadata();

    const variants = [];
    for (const width of widthsFor(originalWidth)) {
      const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
      const webp = `/images/${base}-${width}.webp`;
      const avif = `/images/${base}-${width}.avif`;

      await pipeline.clone().webp({ quality: WEBP_QUALITY, effort: 5 }).toFile(path.join(root, "public", webp));
      await pipeline.clone().avif({ quality: AVIF_QUALITY, effort: 4 }).toFile(path.join(root, "public", avif));

      variants.push({ width, webp, avif });
      written += 2;
    }

    manifest[`/images/${file}`] = { width: originalWidth, height, variants };
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${written} image files and ${Object.keys(manifest).length} manifest entries.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
