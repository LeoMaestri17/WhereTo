import carsRaw from '@/data/cars.json';
import destinationsRaw from '@/data/destinations.json';
import warmRaw from '@/data/warm.json';
import type { CarCatalogue, Destination } from './types';

/**
 * The committed data, typed once.
 *
 * All three files are `import`ed rather than read with `fs`, so they are bundled at build time
 * and work unchanged on Vercel. Nothing here touches the network, holds a key, or can fall
 * through to a live lookup — which is why this is the module the app surfaces are allowed to
 * import and `lib/pricing/*` is not.
 *
 * The casts are the one place this model trusts JSON. `npm run probe:trip` asserts the shape
 * rather than letting a hand-edited file fail in a browser.
 */

export const DESTINATIONS = destinationsRaw as unknown as Destination[];

export const DESTINATIONS_BY_SLUG: Record<string, Destination> = Object.fromEntries(
  DESTINATIONS.map((d) => [d.slug, d]),
);

export const CARS = carsRaw as unknown as CarCatalogue;

export interface TripWindow {
  id: string;
  outbound: string;
  return: string;
  nights: number;
  label: string;
}

interface WarmFile {
  origin: { city: string; airport: string };
  windows: TripWindow[];
}

const warm = warmRaw as unknown as WarmFile;

/**
 * The windows live in warm.json because they are a property of the warm run, not of a place.
 * Every destination is priced for the same set, which is what makes the calendar comparable.
 */
export const WINDOWS: TripWindow[] = warm.windows;

export const ORIGIN = warm.origin;

/** USC, where the cohort actually leaves from. [longitude, latitude], as maps want them. */
export const ORIGIN_COORDS: [number, number] = [-118.2851, 34.0224];

export function windowById(id: string): TripWindow | null {
  return WINDOWS.find((w) => w.id === id) ?? null;
}

/** The rules for where the hire starts, which is Los Angeles for everything in this build. */
export function carRules() {
  return CARS.rules['los-angeles'];
}

export function compactRate() {
  return CARS.rates['los-angeles'].compact;
}

export function fuelRate() {
  return CARS.fuel.california;
}
