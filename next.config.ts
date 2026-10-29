import type { NextConfig } from 'next';

/**
 * Deliberately close to empty.
 *
 * Local artwork under /public needs no configuration. Destination photographs come from
 * Unsplash, fetched once at catalogue build and stored in the records, so their CDN is the one
 * remote host listed below.
 *
 * `turbopack.root` pins the workspace to this directory. Without it Next walks up looking for a
 * lockfile and can find an unrelated one above the repo, which changes how modules resolve.
 */
const nextConfig: NextConfig = {
  images: {
    /* Destination photographs are served by Unsplash's CDN, not by us: the catalogue stores the
       URL and next/image resizes from it. One host, listed explicitly rather than opened up. */
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' }],

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
