import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Summary } from '@/components/trip/Summary';
import { DESTINATIONS, DESTINATIONS_BY_SLUG } from '@/lib/trip/catalogue';

/**
 * The locked trip, and the thing you send to people.
 *
 * Wrapped in Suspense because the summary reads the shared trip out of the query string with
 * `useSearchParams`, which opts the subtree into client rendering; without a boundary that would
 * fail the static build of a route we want prerendered.
 */

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export default async function SummaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!DESTINATIONS_BY_SLUG[slug]) notFound();
  return (
    <Suspense>
      <Summary slug={slug} />
    </Suspense>
  );
}
