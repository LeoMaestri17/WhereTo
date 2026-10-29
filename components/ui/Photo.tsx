'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * Every image in the app goes through here.
 *
 * It owns its frame — a positioned box at a fixed ratio with the image filling it — so callers
 * never have to remember that `next/image` with `fill` needs a positioned parent. Getting that
 * wrong collapses the image to zero height and is invisible until you look.
 *
 * ## The fallback is the point
 *
 * The brief is explicit: never a broken image, never a grey box. The old `ImagePlacard` claimed
 * to do this and did not — it styled itself with four class names that had been renamed out of
 * the stylesheet, so the one path meant to degrade gracefully rendered an unstyled box. It had
 * never been seen because the CDN had never failed in testing, which is exactly how that kind of
 * bug survives.
 *
 * So the fallback here uses no class names at all. It is inline style, built from two palette
 * colours chosen deterministically from the alt text, which means the same destination always
 * gets the same gradient and a missing file still reads as a card for that place. It cannot
 * break when the stylesheet changes because it does not consult the stylesheet.
 */

/** The non-action colours. Peri and coral are excluded: they mean "button" and "total". */
const FALLBACK_COLOURS = [
  ['#ABBF9A', '#A7D1E7'], // sage to sky
  ['#F4D070', '#F6A98D'], // butter to peach
  ['#DF949B', '#F4D070'], // rose to butter
  ['#A7D1E7', '#ABBF9A'], // sky to sage
  ['#F6A98D', '#DF949B'], // peach to rose
  ['#ABBF9A', '#F4D070'], // sage to butter
] as const;

/** Small, stable, and the same in every environment. Not crypto, just a spread. */
function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

const RATIO = {
  square: 'aspect-square',
  wide: 'aspect-[16/9]',
  card: 'aspect-[4/5]',
  banner: 'aspect-[21/9]',
} as const;

export type PhotoRatio = keyof typeof RATIO;

/**
 * A destination photograph with the credit Unsplash's terms require.
 *
 * The credit is part of the component rather than something each surface remembers to add,
 * because a requirement that depends on being remembered at four call sites is a requirement
 * that will be missing at one of them.
 */
export function DestinationPhotoFrame({
  photo,
  fallbackSrc,
  name,
  ratio = 'square',
  sizes = '100vw',
  priority = false,
  eager = false,
  rounded = true,
  className = '',
}: {
  photo: { url: string; author: string; authorUrl: string; alt: string } | null;
  /** Local artwork, used only when there is no photograph yet. */
  fallbackSrc: string | null;
  name: string;
  ratio?: PhotoRatio;
  sizes?: string;
  priority?: boolean;
  eager?: boolean;
  rounded?: boolean;
  className?: string;
}) {
  if (!photo) {
    return (
      <Photo
        src={fallbackSrc}
        alt={name}
        label={name}
        ratio={ratio}
        sizes={sizes}
        priority={priority}
        eager={eager}
        rounded={rounded}
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Photo
        src={photo.url}
        alt={photo.alt || name}
        /* The gradient that stands in if the photograph fails says where you are going, not what
           the photographer called their picture. */
        label={name}
        ratio={ratio}
        sizes={sizes}
        priority={priority}
        eager={eager}
        rounded={rounded}
      />
      <a
        href={photo.authorUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-2 right-2 z-10 rounded-full bg-[rgba(42,40,35,0.55)] px-2 py-0.5 text-[0.6875rem] font-medium text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-[rgba(42,40,35,0.8)]"
      >
        {photo.author}
      </a>
    </div>
  );
}

export function Photo({
  src,
  alt,
  label,
  ratio = 'square',
  sizes = '100vw',
  priority = false,
  eager = false,
  className = '',
  rounded = true,
}: {
  /** A path under /public, or an absolute URL on a CDN, or null. */
  src: string | null;
  alt: string;
  /** What the gradient says when there is no image. Defaults to the alt text. */
  label?: string;
  ratio?: PhotoRatio;
  sizes?: string;
  priority?: boolean;
  /**
   * Load without waiting for the intersection observer.
   *
   * This project has been bitten by lazy loading once already — the previous build shipped black
   * trip cards because Chrome never started the lazy images even with the card fully in view, and
   * the fix was the same then. It reproduced here on the first screen built: one card of four sat
   * blank for as long as you cared to wait, `complete: false`, `currentSrc` empty, while its
   * neighbours loaded normally.
   *
   * So any screen holding a handful of images sets this. A screen holding the whole catalogue
   * must not, and will need the behaviour checked again rather than assumed.
   */
  eager?: boolean;
  className?: string;
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const radius = rounded ? 'rounded-[14px]' : '';

  if (!src || failed) {
    return (
      <GradientPlaceholder
        label={label ?? alt}
        ratio={ratio}
        className={`${radius} ${className}`}
      />
    );
  }

  /*
   * Remote images skip the optimiser, and this is not a preference.
   *
   * next/image fetches a remote source server-side before serving it. On a machine behind a
   * TLS-intercepting proxy that fetch fails with UNABLE_TO_VERIFY_LEAF_SIGNATURE and every
   * photograph 500s, which is exactly what happened here. The browser has the proxy's root CA
   * and Node does not.
   *
   * It also buys nothing: Unsplash resizes and format-negotiates in the URL itself, so the
   * optimiser would be a second round trip doing work already done. Loading straight from their
   * CDN is what their guidelines expect, keeps the browser the only thing that needs to reach
   * the network, and makes onError below the single place a failure is handled.
   */
  if (src.startsWith('http')) {
    const at = (w: number) => {
      const u = new URL(src);
      u.searchParams.set('w', String(w));
      return u.toString();
    };
    return (
      <div className={`relative overflow-hidden ${RATIO[ratio]} ${radius} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- see the note above */}
        <img
          src={at(1600)}
          srcSet={[480, 768, 1080, 1600].map((w) => `${at(w)} ${w}w`).join(', ')}
          sizes={sizes}
          alt={alt}
          loading={eager || priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${RATIO[ratio]} ${radius} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={eager && !priority ? 'eager' : undefined}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/**
 * What a destination with no artwork looks like. A first-class state, not an error:
 * the catalogue is 150-odd places and only a handful will ever have a commissioned image.
 */
export function GradientPlaceholder({
  label,
  ratio = 'square',
  className = '',
}: {
  label: string;
  ratio?: PhotoRatio;
  className?: string;
}) {
  const seed = seedFrom(label || 'whereto');
  const [from, to] = FALLBACK_COLOURS[seed % FALLBACK_COLOURS.length];
  const angle = 115 + (seed % 7) * 10;

  return (
    <div
      className={`relative flex items-end overflow-hidden ${RATIO[ratio]} ${className}`}
      role="img"
      aria-label={label}
      style={{ background: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)` }}
    >
      {/* Ink on these pastels measures well above 4.5:1 — they are all light by construction. */}
      <span
        style={{
          position: 'relative',
          width: '100%',
          padding: '0.875rem 1rem',
          color: '#2A2823',
          fontWeight: 700,
          fontSize: '0.9375rem',
          lineHeight: 1.25,
        }}
      >
        {label}
      </span>
    </div>
  );
}
