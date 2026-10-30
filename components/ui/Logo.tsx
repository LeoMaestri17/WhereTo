/**
 * The WhereTo mark: a folded paper map seen head on.
 *
 * Redrawn from the artwork as four flat triangles so it can scale, sit on any ground and be
 * animated. The original JPG has a cream background baked in, which means it cannot do any of
 * those things.
 *
 * ## The geometry
 *
 * Five fold lines, mirror symmetric. The top edge rises to each outer fold and dips to the
 * centre, which gives the crown silhouette; the bottom zigzags the opposite way, which is what
 * a folded map actually does when you stand it on a table. Every panel is a triangle bounded by
 * two folds and one edge.
 *
 *   B(31,8)           D(69,8)        outer folds, top
 *       /\      /\      /\
 *      /  \    /  \    /  \
 *   A(4,76)  C(50,70)  E(96,76)      outer bottoms and the centre dip
 *
 * ## The colours are not decoration
 *
 * Each panel is one of the four cost categories, and the mapping holds everywhere in the
 * product: sage is getting there, peri is beds, rose is the car, butter is entry and fees. The
 * logo is therefore the legend for the money bar, which is why it is worth it being these four
 * colours in this order rather than any arrangement that looked nice.
 */

import { COST_COLOUR } from '@/lib/trip/categories';

const PANELS = [
  { key: 'travel', points: '4,76 31,8 31,62' },
  { key: 'stay', points: '31,8 50,70 31,62' },
  { key: 'car', points: '69,8 50,70 69,62' },
  { key: 'fees', points: '96,76 69,8 69,62' },
] as const;

export function Logo({
  size = 30,
  /** The chalk grain. Dropped below 40px, where it reads as dirt rather than texture. */
  textured = true,
  /** Folds and unfolds, for a loading or transition state. */
  animated = false,
  className = '',
  title,
}: {
  size?: number;
  textured?: boolean;
  animated?: boolean;
  className?: string;
  title?: string;
}) {
  const showTexture = textured && size >= 40;
  const id = `wt-chalk-${size}${animated ? '-a' : ''}`;

  return (
    <svg
      width={size}
      height={size * 0.84}
      viewBox="0 0 100 84"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {showTexture ? (
        <defs>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="n" />
            <feColorMatrix in="n" type="saturate" values="0" result="g" />
            <feComposite in="g" in2="SourceGraphic" operator="in" result="grain" />
            <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
          </filter>
        </defs>
      ) : null}

      <g filter={showTexture ? `url(#${id})` : undefined}>
        {PANELS.map((panel, i) => (
          <polygon
            key={panel.key}
            points={panel.points}
            fill={COST_COLOUR[panel.key]}
            className={animated ? 'wt-fold' : undefined}
            style={
              animated
                ? {
                    // Each panel pivots on its own fold, so they move like paper rather than
                    // like four shapes that happen to be next to each other.
                    transformOrigin: i < 2 ? '31px 40px' : '69px 40px',
                    animationDelay: `${i * 90}ms`,
                  }
                : undefined
            }
          />
        ))}
      </g>
    </svg>
  );
}

/** The mark and the name together. There was no wordmark anywhere in the product. */
export function Wordmark({ size = 30, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={size} title="WhereTo" />
      <span
        className="font-extrabold tracking-[-0.03em]"
        style={{ fontSize: size * 0.58, lineHeight: 1 }}
      >
        WhereTo
      </span>
    </span>
  );
}
