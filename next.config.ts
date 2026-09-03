import type { NextConfig } from 'next';

/**
 * Deliberately close to empty.
 *
 * There is no `images` block because nothing goes through next/image — see components/
 * SmartImage.tsx. Unsplash resizes and format-negotiates in the URL itself, so the optimizer
 * would add a server-side fetch to the path of every photograph for no gain.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
