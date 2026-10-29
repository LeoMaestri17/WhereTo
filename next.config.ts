import type { NextConfig } from 'next';

/**
 * Deliberately close to empty.
 *
 * There is no `images.remotePatterns` block because every image is a local file under
 * /public/assets. The optimiser handles those with no configuration, and resizes them into the
 * responsive set that `components/ui/Photo.tsx` asks for.
 *
 * That changes when the catalogue grows: Unsplash URLs are fetched once at build time and stored
 * in the destination records, and serving them through next/image will need their host listed
 * here. Until then, adding it would be configuration for a thing that does not exist.
 *
 * `turbopack.root` pins the workspace to this directory. Without it Next walks up looking for a
 * lockfile and can find an unrelated one above the repo, which changes how modules resolve.
 */
const nextConfig: NextConfig = {
  images: {
    /*
     * WebP only, and this one line is worth the explanation.
     *
     * Next offers AVIF first when the browser's Accept header allows it, which every modern
     * browser does. AVIF encoding is slow — on this machine a single 1000x1000 illustration took
     * over twenty seconds, during which the card renders blank and the browser will not even
     * pick a srcset candidate. It looked exactly like a broken image and cost an afternoon to
     * pin down; `curl` fetched the same URL in 66ms because it never asked for AVIF.
     *
     * The sources are already WebP flat illustration, so AVIF saves a few kilobytes at most.
     * Dropping it costs nothing and removes the whole failure.
     */
    formats: ['image/webp'],
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
