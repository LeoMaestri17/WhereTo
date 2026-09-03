import type { NextConfig } from 'next';

/**
 * Deliberately close to empty.
 *
 * There is no `images` block because nothing goes through next/image — see components/
 * SmartImage.tsx. Unsplash resizes and format-negotiates in the URL itself, so the optimizer
 * would add a server-side fetch to the path of every photograph for no gain.
 *
 * `turbopack.root` pins the workspace to this directory. Without it Next walks up looking for a
 * lockfile and can find an unrelated one above the repo, which changes how modules resolve.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
