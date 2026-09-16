import { SmartImage } from '@/components/SmartImage';
import {
  ArrowIcon,
  Eyebrow,
  PhotoFrame,
  PillLink,
  RidgeMark,
} from '@/components/nocturne/primitives';
import { MEASURE } from '@/components/nocturne/measure';
import { PHOTOS } from '@/lib/seed/images';

/**
 * The landing page.
 *
 * One screen, one photograph, one sentence, one way forward.
 *
 * It is deliberately not about California. The product happens to start from Los Angeles, but the
 * thing it does — take a few answers and return what a trip really costs, split between the people
 * going — is not regional, and a landing page that names one city sells the smaller idea. Nor does
 * it mention how many destinations or weekends are loaded: that is a fact about this build, not
 * about the product, and stating it invites the reader to judge the scaffolding.
 */
export default function LandingPage() {
  return (
    <main className="min-h-dvh">
      <PhotoFrame
        scrim="hero"
        className="flex min-h-dvh flex-col"
        image={
          <SmartImage
            photoId={PHOTOS.zionCanyon}
            alt=""
            width={2000}
            height={1400}
            priority
            sizes="100vw"
            className="sq-graded h-full w-full object-cover"
          />
        }
      >
        {/* The mark and the name together. The mark alone said nothing. */}
        <header className={`${MEASURE} flex items-center gap-3 pt-8`}>
          <RidgeMark className="text-type" size={26} />
          <span className="type-title text-[1.0625rem] tracking-[-0.01em] text-type">WhereTo</span>
        </header>

        {/* Bottom third. Everything lands here. */}
        <div className={`${MEASURE} mt-auto pb-20 sm:pb-28`}>
          <div className="max-w-2xl">
            <Eyebrow className="sq-rise sq-rise-1 sq-text-glow font-medium text-type">
              Trip planning, with the real numbers
            </Eyebrow>

            <h1 className="type-hero sq-rise sq-rise-2 sq-text-glow mt-6 text-type">
              Plan a trip in two minutes. See every cost in one place.
            </h1>

            <p className="type-body-lg sq-rise sq-rise-3 sq-text-glow mt-6 max-w-lg text-type">
              Flights, beds, transport, entry fees. Real prices, split between you, before you
              commit. Not a headline rate for somebody else — the figure you actually pay, with the
              surcharges that depend on your age and who is driving already in it.
            </p>

            <div className="sq-rise sq-rise-4 mt-10">
              <PillLink href="/survey" variant="solid" size="lg">
                Plan my trip
                <ArrowIcon size={17} />
              </PillLink>
            </div>

            {/* --type at weight 500, not the muted eyebrow tone. Small tracked caps over a
                photograph fail perceptually before they fail numerically: the stems at 11px are
                hairlines, and weight is what makes them survive the image behind. */}
            <p className="type-eyebrow sq-rise sq-rise-4 mt-10 font-medium text-type">
              Live Pricing · Made For Students · No sign up
            </p>
          </div>
        </div>
      </PhotoFrame>
    </main>
  );
}
