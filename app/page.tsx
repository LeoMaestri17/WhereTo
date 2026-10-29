import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Photo } from '@/components/ui/Photo';
import { ButtonLink, Card, Eyebrow, MEASURE, SourceTag, Total } from '@/components/ui/primitives';
import { DESTINATIONS } from '@/lib/trip/catalogue';

/**
 * The landing page.
 *
 * It exists to say one thing: the number on a WhereTo card is the whole trip, and you can see
 * where it came from. So the page shows a real total with a real provenance line underneath it
 * rather than describing the idea in prose.
 *
 * Deliberately not about California. The product starts from Los Angeles because that is where
 * the research is, but what it does — take a few answers and return what a trip actually costs,
 * split between the people going — is not regional, and naming one city sells the smaller idea.
 */
export default function LandingPage() {
  return (
    <main className="min-h-dvh pb-24">
      <header className={`${MEASURE} flex items-center gap-2.5 py-7`}>
        {/* The mark is drawn on cream and sits on --ground without a cut-out. */}
        <Image
          src="/assets/logo.webp"
          alt=""
          width={36}
          height={36}
          priority
          className="h-9 w-9 rounded-full object-cover"
        />
        <span className="text-[1.0625rem] font-extrabold tracking-[-0.02em]">WhereTo</span>
      </header>

      <section className={`${MEASURE} pt-6 sm:pt-12`}>
        <div className="max-w-3xl">
          <Eyebrow>Travel · Beds · Car · Fuel</Eyebrow>
          <h1 className="type-hero mt-5">
            The whole trip, priced. Not just the flight.
          </h1>
          <p className="type-body-lg mt-5 max-w-xl">
            Every number here came from somewhere, and the page says where. Including the
            surcharges that depend on your age and who is driving — the ones that turn a $180
            weekend into a $293 one.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/trip/zion" size="lg">
              See a real trip
              <ArrowRight size={17} strokeWidth={2.5} />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* The artwork, full measure. One image doing the emotional work. */}
      <section className={`${MEASURE} mt-12`}>
        <Photo
          src="/assets/hero-canyon.webp"
          alt="A canyon road at sunrise"
          ratio="banner"
          sizes="(max-width: 1152px) 100vw, 1152px"
          priority
        />
      </section>

      {/* What the cards will look like. Four real destinations, four real illustrations. */}
      <section className={`${MEASURE} mt-14`}>
        <Eyebrow>Priced so far</Eyebrow>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((dest) => (
            <Card key={dest.slug} className="overflow-hidden" interactive>
              <Photo
                src={dest.image}
                alt={dest.name}
                ratio="square"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                rounded={false}
                eager
              />
              <div className="p-4">
                <Eyebrow>{dest.eyebrow}</Eyebrow>
                <h2 className="type-title mt-2">{dest.name}</h2>
                <p className="type-body mt-2 line-clamp-2 text-muted">{dest.hook}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* The claim, made concretely rather than asserted. */}
      <section className={`${MEASURE} mt-14`}>
        <Card className="p-6 sm:p-8">
          <Eyebrow>Zion, two nights, four people sharing</Eyebrow>
          <Total className="mt-3" amount="$291" caption="a head, everything in" />
          <div className="mt-5 flex flex-col gap-2 border-t border-hairline pt-5">
            <SourceTag source="operator" detail="Park entry and the non-resident surcharge, nps.gov" />
            <SourceTag source="authored" detail="Beds in Springdale, not yet quoted for these dates" />
            <SourceTag source="operator" detail="Fuel at the AAA California average" />
          </div>
          <p className="type-body mt-5 max-w-lg text-muted">
            The $100 non-resident surcharge is per person and does not split. Most planners miss
            it entirely, which is most of the gap between their estimate and the bill.
          </p>
        </Card>
      </section>
    </main>
  );
}
