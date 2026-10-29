/**
 * Destination photography, fetched once at catalogue build and committed.
 *
 *   npm run fetch-photos                 a dry run: prints what it would search for
 *   npm run fetch-photos -- --live       searches Unsplash and writes destinations.json
 *   npm run fetch-photos -- --live --force   re-rolls destinations that already have a photo
 *
 * The running app never calls Unsplash. This stores the CDN URL, the photographer and their
 * profile link, and every page afterwards serves straight from Unsplash's CDN: no runtime cost,
 * no key in the browser, and no quota to spend on a page load.
 *
 * Unsplash's API terms are not optional and are handled here rather than left to a component:
 * the photographer is credited with a link back, those links carry the referral parameters, and
 * the download endpoint is pinged for each photo actually used, which is how they attribute
 * usage back to the photographer. A component that renders the credit can be tidied away by
 * someone who does not know it is load-bearing; a stored URL with the parameters already in it
 * is harder to lose.
 *
 * Demo tier is 50 requests an hour, which covers a 150-record catalogue across three sittings.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Destination, DestinationPhoto } from '../lib/trip/types';

const APP_NAME = 'whereto';
const FILE = path.join(process.cwd(), 'data', 'destinations.json');

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

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: { raw: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
}

/** Their referral parameters, required on every link back. */
function withReferral(url: string): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', APP_NAME);
  u.searchParams.set('utm_medium', 'referral');
  return u.toString();
}

/**
 * Unsplash resizes and format-negotiates in the URL itself, so the stored link already asks for
 * the width the largest surface uses. next/image then serves the responsive set from it.
 */
function sized(raw: string): string {
  const u = new URL(raw);
  u.searchParams.set('auto', 'format');
  u.searchParams.set('fit', 'crop');
  u.searchParams.set('w', '1600');
  u.searchParams.set('q', '80');
  return u.toString();
}

async function search(query: string, key: string): Promise<UnsplashPhoto | null> {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('per_page', '1');
  url.searchParams.set('content_filter', 'high');

  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
  });
  if (!response.ok) {
    throw new Error(`Unsplash returned ${response.status}: ${(await response.text()).slice(0, 160)}`);
  }
  const data = (await response.json()) as { results: UnsplashPhoto[] };
  return data.results[0] ?? null;
}

/** Their guidelines: ping this when a photo is actually used, so the photographer gets credit. */
async function registerDownload(photo: UnsplashPhoto, key: string): Promise<void> {
  try {
    await fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
    });
  } catch {
    // Not fatal to the build, but it is a term of use, so it is worth a line.
    console.warn(`  (could not register the download for ${photo.id})`);
  }
}

async function main(): Promise<void> {
  const live = process.argv.includes('--live');
  const force = process.argv.includes('--force');

  const destinations = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Destination[];
  const todo = destinations.filter((d) => force || d.photo === null);

  console.log('');
  console.log(`WhereTo — fetch-photos${live ? '' : ' (dry run)'}`);
  console.log('─'.repeat(78));
  console.log(`${todo.length} of ${destinations.length} destinations need a photograph`);
  console.log('─'.repeat(78));

  if (todo.length === 0) {
    console.log('Nothing to do. Pass --force to replace photographs that already exist.\n');
    return;
  }

  if (!live) {
    for (const d of todo) console.log(`  ${d.slug.padEnd(16)} "${d.photoQuery}"`);
    console.log('─'.repeat(78));
    console.log(`Dry run. ${todo.length} searches were NOT made.`);
    console.log('To fetch for real:  npm run fetch-photos -- --live\n');
    return;
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.error(
      '\nRefusing to start: no UNSPLASH_ACCESS_KEY is set.\n\n' +
        '  1. https://unsplash.com/oauth/applications, New Application\n' +
        '  2. Copy the Access Key (not the Secret)\n' +
        '  3. Add UNSPLASH_ACCESS_KEY=... to .env.local\n',
    );
    process.exit(1);
  }

  let ok = 0;
  for (const dest of todo) {
    try {
      const found = await search(dest.photoQuery, key);
      if (!found) {
        console.log(`  none  ${dest.slug.padEnd(16)} nothing matched "${dest.photoQuery}"`);
        continue;
      }
      await registerDownload(found, key);

      const photo: DestinationPhoto = {
        url: sized(found.urls.raw),
        id: found.id,
        author: found.user.name,
        authorUrl: withReferral(found.user.links.html),
        alt: found.description ?? found.alt_description ?? dest.name,
        fetchedAt: new Date().toISOString(),
      };
      dest.photo = photo;
      ok += 1;

      console.log(`  ok    ${dest.slug.padEnd(16)} ${found.id} by ${photo.author}`);
      console.log(`        "${photo.alt}"`);
    } catch (err) {
      console.log(`  FAIL  ${dest.slug.padEnd(16)} ${err instanceof Error ? err.message : err}`);
    }
  }

  fs.writeFileSync(FILE, `${JSON.stringify(destinations, null, 2)}\n`);
  console.log('─'.repeat(78));
  console.log(`${ok} of ${todo.length} fetched. data/destinations.json written.`);
  console.log('Check each one is actually the place before committing.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
