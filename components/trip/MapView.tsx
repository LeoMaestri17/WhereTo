'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ORIGIN_COORDS } from '@/lib/trip/catalogue';
import { money } from '@/lib/trip/quote';
import type { Destination } from '@/lib/trip/types';

/**
 * The map, as a peer of the board rather than a replacement for it.
 *
 * Two things make it ours rather than a generic map with markers on it.
 *
 * **Price pins.** A pin says "$127", not "here is a place". The question someone arrives with is
 * what they can afford this weekend, so the answer is on the pin and they never have to click to
 * find it.
 *
 * **Drive-time bands.** Soft rings at two, four and six hours from campus. This is the question
 * nobody else answers: not where somewhere is, but whether it is reachable in the time you have.
 * A place outside the four-hour ring is a different kind of weekend from one inside it, and the
 * rings say so before any price is read.
 *
 * The rings are an aid, not a measurement: a real isochrone would follow the roads, and Mapbox's
 * isochrone API stops at sixty minutes, so these are circles at a stated average speed. They are
 * drawn and labelled as approximate, which is fine for a visual band and would not be fine for a
 * price.
 */

/** Rings, and the speed they assume. Stated rather than hidden, because they are approximate. */
const ASSUMED_MPH = 55;
const BANDS = [2, 4, 6] as const;

/** Degrees of latitude per mile. Longitude is scaled by the cosine of the latitude below. */
const MILES_PER_DEGREE = 69;

function ringFeature(hours: number) {
  const radiusMiles = hours * ASSUMED_MPH;
  const [lon, lat] = ORIGIN_COORDS;
  const points: [number, number][] = [];
  for (let i = 0; i <= 96; i += 1) {
    const angle = (i / 96) * Math.PI * 2;
    const dLat = (radiusMiles / MILES_PER_DEGREE) * Math.cos(angle);
    const dLon =
      ((radiusMiles / MILES_PER_DEGREE) * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);
    points.push([lon + dLon, lat + dLat]);
  }
  return {
    type: 'Feature' as const,
    properties: { hours },
    geometry: { type: 'Polygon' as const, coordinates: [points] },
  };
}

/**
 * Whether this build has a map at all.
 *
 * NEXT_PUBLIC_* is inlined at build time, so this is a constant the moment the bundle is made,
 * not something that can change while the app runs: a deployment either has a token or it never
 * will. The board hides the Map tab when it does not, which is why there is no "needs a token"
 * placeholder here any more — that sentence was written for whoever deploys the app and was
 * being shown to students looking for a weekend away.
 */
export const MAP_AVAILABLE = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

/**
 * The cream palette, applied to Mapbox's own layers.
 *
 * This used to be a CSS filter on the canvas — sepia, desaturate, hue-rotate — which worked in
 * the sense that the map came out cream, and failed in the sense that it also went through the
 * drive-time bands drawn on that same canvas. The bands are the one thing on this map nobody
 * else offers and they were the faintest thing on it. Desaturating the base map and the data
 * drawn over it with one instruction can only ever do that.
 *
 * Matching is on `source-layer`, which is the Mapbox Streets v8 tile schema — `water`, `road`,
 * `admin` — and not on layer ids. An earlier attempt matched ids, which Mapbox renames between
 * style versions, so it silently coloured nothing. Each layer is set inside its own try/catch
 * because one layer rejecting a paint property should cost that layer, not the whole map.
 */
const MAP_PALETTE = {
  ground: '#f8f2e6',
  water: '#bcdcee',
  landuse: '#eef0e4',
  road: '#e8dfcd',
  roadMajor: '#ddd2bc',
  admin: 'rgba(42, 40, 35, 0.22)',
  label: '#8a8275',
  labelHalo: '#f8f2e6',
} as const;

/** Only the properties this function sets; Mapbox types the full list as a 300-member union. */
type PaintProp =
  | 'background-color'
  | 'fill-color'
  | 'line-color'
  | 'text-color'
  | 'text-halo-color';

function paintBaseMap(m: mapboxgl.Map) {
  let layers: mapboxgl.Layer[];
  try {
    layers = (m.getStyle()?.layers ?? []) as mapboxgl.Layer[];
  } catch {
    return;
  }

  for (const layer of layers) {
    // Our own layers are already the colour we want them.
    if (layer.id.startsWith('band-')) continue;

    const source = (layer as { 'source-layer'?: string })['source-layer'] ?? '';
    const set = (prop: PaintProp, value: string) => {
      try {
        m.setPaintProperty(layer.id, prop, value);
      } catch {
        // A layer that does not carry this property is not an error worth stopping for.
      }
    };

    if (layer.type === 'background') {
      set('background-color', MAP_PALETTE.ground);
    } else if (layer.type === 'fill') {
      if (source === 'water' || source === 'waterway') set('fill-color', MAP_PALETTE.water);
      else if (source === 'landuse' || source === 'landuse_overlay')
        set('fill-color', MAP_PALETTE.landuse);
      else set('fill-color', MAP_PALETTE.ground);
    } else if (layer.type === 'line') {
      if (source === 'water' || source === 'waterway') set('line-color', MAP_PALETTE.water);
      else if (source === 'admin') set('line-color', MAP_PALETTE.admin);
      else if (source === 'road' || source === 'aeroway')
        set('line-color', layer.id.includes('motorway') ? MAP_PALETTE.roadMajor : MAP_PALETTE.road);
      else set('line-color', MAP_PALETTE.road);
    } else if (layer.type === 'symbol') {
      set('text-color', MAP_PALETTE.label);
      set('text-halo-color', MAP_PALETTE.labelHalo);
    }
  }
}

export interface MapPin {
  dest: Destination;
  perPerson: number | null;
}

export function MapView({
  pins,
  hovered,
  onHover,
  onSelect,
}: {
  pins: MapPin[];
  hovered: string | null;
  onHover: (slug: string | null) => void;
  onSelect: (slug: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Record<string, mapboxgl.Marker>>({});
  const order = useRef<string[]>([]);
  const frame = useRef<number | null>(null);

  /*
   * Price labels collide badly near the origin: Laguna, Temecula, Idyllwild, Big Bear and Palm
   * Springs sit within a short radius and their labels overlap into an unreadable knot.
   *
   * So pins are laid out in screen space on every view change. Working in priority order, a pin
   * whose label would overlap one already placed collapses to a dot instead. Nothing is removed
   * and nothing is hidden: a collapsed pin keeps its position and its colour, expands on hover,
   * and becomes a full label again as soon as zooming gives it room. Cheapest first, because
   * that is the pin most worth being able to read.
   */
  const relayout = useRef(() => {});

  useEffect(() => {
    if (!container.current || map.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const m = new mapboxgl.Map({
      container: container.current,
      /* Mapbox's lightest base, then the land, water and roads are recoloured below so the map
         sits in the palette rather than fighting it. A default street or satellite style would
         be the loudest thing on the page. */
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-119.2, 35.6],
      zoom: 4.6,
      attributionControl: true,
      cooperativeGestures: true,
    });
    map.current = m;

    const layout = () => {
      const placed: { left: number; top: number; right: number; bottom: number }[] = [];
      for (const slug of order.current) {
        const marker = markers.current[slug];
        if (!marker) continue;
        const el = marker.getElement();

        // Measure as a full label, or a pin that collapsed last pass never grows back.
        el.classList.remove('is-dot');
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const p = m.project(marker.getLngLat());
        const box = {
          left: p.x - w / 2,
          top: p.y - h / 2,
          right: p.x + w / 2,
          bottom: p.y + h / 2,
        };

        const clashes = placed.some(
          (q) => box.left < q.right && box.right > q.left && box.top < q.bottom && box.bottom > q.top,
        );
        if (clashes) el.classList.add('is-dot');
        else placed.push(box);
      }
    };

    relayout.current = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(layout);
    };

    m.on('move', () => relayout.current());
    m.on('zoom', () => relayout.current());

    m.on('load', () => {
      /* The bands go on before the recolouring, not after. A previous version painted the base
         map first, threw partway through, and took the bands down with it — the feature that
         justifies having a map at all vanished because of a styling error. */
      m.addSource('bands', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: BANDS.map(ringFeature) },
      });
      // Drawn largest first so the inner bands read as denser rather than being covered.
      m.addLayer({
        id: 'band-fill',
        type: 'fill',
        source: 'bands',
        paint: {
          /* Ink, not peri. These bands are hours from campus — not a cost, so not a cost colour.
             Peri filled means Beds now, and a lavender ring round Los Angeles would be the third
             thing peri was asked to say. A neutral also lets the pins keep every colour on the
             map to themselves. */
          'fill-color': '#2a2823',
          'fill-opacity': ['interpolate', ['linear'], ['get', 'hours'], 2, 0.09, 6, 0.035],
        },
      });
      m.addLayer({
        id: 'band-line',
        type: 'line',
        source: 'bands',
        paint: {
          'line-color': '#2a2823',
          'line-width': 1.25,
          'line-opacity': 0.32,
          'line-dasharray': [4, 3],
        },
      });

      paintBaseMap(m);

      const origin = document.createElement('div');
      origin.className = 'wt-origin-dot';
      new mapboxgl.Marker({ element: origin }).setLngLat(ORIGIN_COORDS).addTo(m);
    });

    return () => {
      m.remove();
      map.current = null;
      markers.current = {};
    };
  }, []);

  /* Pins are rebuilt when the prices change, which is every time a control moves. */
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    for (const marker of Object.values(markers.current)) marker.remove();
    markers.current = {};

    for (const pin of pins) {
      if (!pin.dest.coords) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'wt-pin';
      el.dataset.slug = pin.dest.slug;
      el.style.setProperty('--pin', `var(--${pin.dest.tone})`);
      el.textContent = pin.perPerson === null ? '—' : money(pin.perPerson);
      el.setAttribute(
        'aria-label',
        `${pin.dest.name}${pin.perPerson === null ? ', needs a driver' : `, from ${money(pin.perPerson)} a head`}`,
      );
      if (pin.perPerson === null) el.classList.add('is-blocked');

      el.addEventListener('mouseenter', () => onHover(pin.dest.slug));
      el.addEventListener('mouseleave', () => onHover(null));
      el.addEventListener('click', () => onSelect(pin.dest.slug));

      markers.current[pin.dest.slug] = new mapboxgl.Marker({ element: el })
        .setLngLat(pin.dest.coords)
        .addTo(m);
    }

    order.current = [...pins]
      .filter((p) => p.dest.coords)
      .sort((a, b) => (a.perPerson ?? Infinity) - (b.perPerson ?? Infinity))
      .map((p) => p.dest.slug);
    relayout.current();
  }, [pins, onHover, onSelect]);

  /* Hovering a card raises its pin, which is the other half of the link. */
  useEffect(() => {
    for (const [slug, marker] of Object.entries(markers.current)) {
      marker.getElement().classList.toggle('is-active', slug === hovered);
    }
    if (hovered) {
      order.current = [hovered, ...order.current.filter((s) => s !== hovered)];
      relayout.current();
    }
  }, [hovered, pins]);

  return (
    <div className="relative">
      <div ref={container} className="h-[62vh] w-full overflow-hidden rounded-[14px]" />
      {/* The rings are approximate, and say so once rather than on every pin.

          Top-left, not bottom-left, where it covered the Mapbox wordmark. Their terms require
          that attribution stay visible, so this is not a matter of taste. */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-[10px] border border-hairline bg-paper/92 px-3 py-2 backdrop-blur">
        <p className="type-label">Drive time from campus</p>
        <p className="type-body mt-1 text-muted">
          Rings at 2, 4 and 6 hours, about {ASSUMED_MPH} mph
        </p>
      </div>
    </div>
  );
}
