'use client';

import { useState } from 'react';
import { unsplashUrl } from '@/lib/seed/images';

/**
 * Every image in the app goes through here.
 *
 * Photo ids are stored rather than URLs so each surface can request the width it actually needs.
 * If the request fails — offline, blocked, or a photo that has gone away — we draw a placard
 * locally instead. It is deliberately not a grey box: it carries the name of the thing, so a
 * card without its photograph still reads as that card.
 *
 * These load straight from the Unsplash CDN rather than through next/image. Unsplash already
 * does the resizing and format negotiation in the URL (`auto=format&w=…&q=…`), so the optimizer
 * would be a second round trip doing work that is already done — and it puts a server-side fetch
 * in the path of every image, which fails on any machine behind a TLS-intercepting proxy.
 * Loading directly keeps the browser as the only thing that needs to reach the network, and
 * makes the fallback below the single place a failure is handled.
 */
export function SmartImage({
  photoId,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes,
}: {
  photoId: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!photoId || failed) {
    return <ImagePlacard label={alt} className={className} />;
  }

  const src = unsplashUrl(photoId, width, height);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the note above: Unsplash serves
    // the correct size and format itself, so next/image would add a redundant server hop.
    <img
      src={src}
      srcSet={`${src} 1x, ${unsplashUrl(photoId, width * 2, height * 2)} 2x`}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/** The offline fallback. Drawn locally, no network, and it still says what it is. */
export function ImagePlacard({ label, className = '' }: { label: string; className?: string }) {
  const seed = [...label].reduce((a, c) => a + c.charCodeAt(0), 0) % 997;
  const angle = seed % 60;
  return (
    <div
      className={`relative flex items-end overflow-hidden bg-surface-2 ${className}`}
      role="img"
      aria-label={label}
    >
      <svg
        className="absolute inset-0 h-full w-full text-line-strong"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={`sq-hatch-${seed}`}
            width="9"
            height="9"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle})`}
          >
            <line x1="0" y1="0" x2="0" y2="9" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#sq-hatch-${seed})`} opacity="0.5" />
      </svg>
      <span className="relative w-full p-3 type-meta font-medium leading-tight text-muted">
        {label}
      </span>
    </div>
  );
}
