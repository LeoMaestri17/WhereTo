import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BuildCanvas } from '@/components/trip/BuildCanvas';
import { DESTINATIONS, DESTINATIONS_BY_SLUG } from '@/lib/trip/catalogue';

/**
 * One destination, fully costed.
 *
 * A thin server shell: it resolves the slug and hands over. The canvas itself is a client
 * component because the group size and the driver change the price on every keystroke and those
 * changes must never cost a round trip — the whole architecture rests on a page that reads
 * committed data and talks to nothing.
 */

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dest = DESTINATIONS_BY_SLUG[slug];
  if (!dest) return { title: 'WhereTo' };
  return { title: `${dest.name} — WhereTo`, description: dest.hook };
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!DESTINATIONS_BY_SLUG[slug]) notFound();
  return <BuildCanvas slug={slug} />;
}
