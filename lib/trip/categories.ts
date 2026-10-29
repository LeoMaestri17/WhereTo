/**
 * The four cost categories, and the one place their colours are decided.
 *
 * The logo is a folded map with four panels; the money breakdown has four lines. They are the
 * same four, in the same order, in the same colours, so the mark doubles as the legend and the
 * colour coding carries across cards, panels, trip rows and anything added later.
 *
 * Because that only works if it is true everywhere, this is the single source. A component that
 * picks its own colour for "beds" breaks the system silently, so no component picks.
 */

export type CostCategory = 'travel' | 'stay' | 'car' | 'fees';

export const COST_CATEGORIES: CostCategory[] = ['travel', 'stay', 'car', 'fees'];

/** CSS custom properties, so a palette change in globals.css reaches the logo and the bars. */
export const COST_COLOUR: Record<CostCategory, string> = {
  travel: 'var(--sage)',
  stay: 'var(--peri)',
  car: 'var(--coral)',
  fees: 'var(--butter)',
};

export const COST_LABEL: Record<CostCategory, string> = {
  travel: 'Getting there',
  stay: 'Beds',
  car: 'Car',
  fees: 'Entry and fees',
};
