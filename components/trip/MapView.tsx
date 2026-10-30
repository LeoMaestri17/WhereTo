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
          'fill-color': '#A7B0E7',
          'fill-opacity': ['interpolate', ['linear'], ['get', 'hours'], 2, 0.16, 6, 0.05],
        },
      });
      m.addLayer({
        id: 'band-line',
        type: 'line',
        source: 'bands',
        paint: { 'line-color': '#7C88DC', 'line-width': 1, 'line-opacity': 0.4, 'line-dasharray': [3, 3] },
      });

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

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-[14px] border border-hairline bg-paper">
        <p className="text-[0.9375rem] font-bold">Map needs a token</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={container} className="wt-map h-[62vh] w-full overflow-hidden rounded-[14px]" />
      {/* The rings are approximate, and say so once rather than on every pin. */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-[10px] border border-hairline bg-paper/92 px-3 py-2 backdrop-blur">
        <p className="type-label">Drive time from campus</p>
        <p className="type-body mt-1 text-muted">
          Rings at 2, 4 and 6 hours, about {ASSUMED_MPH} mph
        </p>
      </div>
    </div>
  );
}
