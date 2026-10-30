/**
 * Real road distances, fetched once at catalogue build and committed.
 *
 *   npm run fetch-distances                 a dry run: prints what it would route
 *   npm run fetch-distances -- --live       geocodes and routes, then writes destinations.json
 *   npm run fetch-distances -- --live --force   re-routes destinations already done
 *
 * Why this exists rather than a straight-line distance times a fudge factor: the fuel figure is
 * the AAA state average multiplied by the mileage, so a guessed mileage makes a guessed fuel
 * line. The app already labels it "Our estimate" while `distanceSource` is 'authored'. Routing
 * it is what earns the line the operator-sourced label it would otherwise be borrowing.
 *
 * OpenRouteService, free tier, 2,000 directions a day and no card. Two calls per destination:
 * one to turn a name into coordinates, one to route from campus. The coordinates are kept, so a
 * re-route later costs one call rather than two.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Destination } from '../lib/trip/types';

/** USC, which is where the cohort actually leaves from. */
const ORIGIN: [number, number] = [-118.2851, 34.0224];

const FILE = path.join(process.cwd(), 'data', 'destinations.json');
const METRES_PER_MILE = 1609.344;

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!(key in process.env)) process.env[key] = line.slice(eq + 1).trim();
  }
}

loadEnvLocal();

interface WithCoords extends Destination {
  /** [longitude, latitude], as every routing engine wants them. */
  coords?: [number, number];
}

async function geocode(query: string, key: string): Promise<[number, number]> {
  const url = new URL('https://api.openrouteservice.org/geocode/search');
  url.searchParams.set('api_key', key);
  url.searchParams.set('text', query);
  url.searchParams.set('boundary.country', 'US');
  url.searchParams.set('size', '1');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`geocode ${response.status}`);
  const data = (await response.json()) as {
    features: { geometry: { coordinates: [number, number] } }[];
  };
  const hit = data.features[0];
  if (!hit) throw new Error(`no match for "${query}"`);
  return hit.geometry.coordinates;
}

async function route(
  to: [number, number],
  key: string,
): Promise<{ miles: number; hours: number }> {
  const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates: [ORIGIN, to] }),
  });
  if (!response.ok) {
    throw new Error(`route ${response.status}: ${(await response.text()).slice(0, 140)}`);
  }
  const data = (await response.json()) as {
    routes: { summary: { distance: number; duration: number } }[];
  };
  const summary = data.routes[0]?.summary;
  if (!summary) throw new Error('no route returned');
  return {
    miles: Math.round(summary.distance / METRES_PER_MILE),
    hours: Math.round((summary.duration / 3600) * 4) / 4,
  };
}

function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes}m each way`;
  return minutes === 0 ? `${whole}h each way` : `${whole}h ${minutes}m each way`;
}

async function main(): Promise<void> {
  const live = process.argv.includes('--live');
  const force = process.argv.includes('--force');

  const destinations = JSON.parse(fs.readFileSync(FILE, 'utf8')) as WithCoords[];
  const todo = destinations.filter((d) => force || d.drive.distanceSource !== 'routed');

  console.log('');
  console.log(`WhereTo — fetch-distances${live ? '' : ' (dry run)'}`);
  console.log('─'.repeat(78));
  console.log(`${todo.length} of ${destinations.length} destinations have authored mileage`);
  console.log(`${todo.length * 2} OpenRouteService calls, against a free tier of 2,000 a day`);
  console.log('─'.repeat(78));

  if (todo.length === 0) {
    console.log('Nothing to do. Pass --force to re-route.\n');
    return;
  }

  if (!live) {
    for (const d of todo) {
      console.log(`  ${d.slug.padEnd(16)} currently ${String(d.drive.miles).padStart(4)} mi (estimated)`);
    }
    console.log('─'.repeat(78));
    console.log('Dry run. Nothing was requested.');
    console.log('To route for real:  npm run fetch-distances -- --live\n');
    return;
  }

  const key = process.env.OPENROUTESERVICE_API_KEY;
  if (!key) {
    console.error(
      '\nRefusing to start: no OPENROUTESERVICE_API_KEY is set.\n\n' +
        '  1. https://openrouteservice.org/dev/#/signup\n' +
        '  2. Copy the token from the dashboard\n' +
        '  3. Add OPENROUTESERVICE_API_KEY=... to .env.local\n',
    );
    process.exit(1);
  }

  let ok = 0;
  for (const dest of todo) {
    try {
      const coords = dest.coords ?? (await geocode(`${dest.name}, ${dest.region}`, key));
      const { miles, hours } = await route(coords, key);
      const was = dest.drive.miles;

      dest.coords = coords;
      dest.drive.miles = miles;
      dest.drive.roundTripMiles = miles * 2;
      dest.drive.hoursEachWay = hours;
      dest.drive.time = formatHours(hours);
      dest.drive.distanceSource = 'routed';
      /* No display string to rewrite here any more. The place tag is rendered from region and
         drive.miles, so a routed mileage reaches the card by updating the mileage and nothing
         else — which is the point of not storing it twice. */
      ok += 1;

      const drift = miles - was;
      console.log(
        `  ok    ${dest.slug.padEnd(16)} ${String(miles).padStart(4)} mi, ${formatHours(hours)}` +
          `  (estimate was ${was}, ${drift >= 0 ? '+' : ''}${drift})`,
      );
    } catch (err) {
      console.log(`  FAIL  ${dest.slug.padEnd(16)} ${err instanceof Error ? err.message : err}`);
    }
    // Free tier is rate limited per minute; this keeps a 20-destination run inside it.
    await new Promise((r) => setTimeout(r, 1500));
  }

  fs.writeFileSync(FILE, `${JSON.stringify(destinations, null, 2)}\n`);
  console.log('─'.repeat(78));
  console.log(`${ok} of ${todo.length} routed. Their fuel lines now read as published rather than estimated.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
