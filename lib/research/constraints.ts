import type { ConstraintFlag, ResearchPlan, ResearchRequest } from './types';

/**
 * The constraint engine.
 *
 * A general travel estimate is wrong for this cohort in specific, repeatable ways: the under-25
 * rental surcharge, the deposit hold that needs a US card, the 21+ door, the fact that six people
 * are sharing two rooms. This module turns the planner's inputs into those warnings.
 *
 * It runs over cached plans, and it also runs over live results as a floor — if the model forgets
 * to mention the young-driver fee on a plan that rents a car, we add it back.
 */

/** Signals read off the plan itself, so the flags match what is actually being proposed. */
export interface PlanShape {
  hasRentalCar: boolean;
  hasHotel: boolean;
  hasFlight: boolean;
  hasNightlife: boolean;
  nights: number;
  cheapestPerPerson: number;
}

const RENTAL_WORDS = /\b(rental|rent a car|hertz|enterprise|avis|budget|alamo|sixt|turo|zipcar)\b/i;
const HOTEL_WORDS = /\b(hotel|motel|inn|resort|hostel|airbnb|lodge|suites)\b/i;
const FLIGHT_WORDS = /\b(flight|airlines|airways|jetblue|spirit|southwest|delta|united|alaska)\b/i;
const NIGHT_WORDS = /\b(casino|club|bar|nightlife|lounge|speakeasy|21\+)\b/i;

export function readPlanShape(plan: Pick<ResearchPlan, 'options'>, nights: number): PlanShape {
  const all = plan.options.flatMap((o) => [...o.transport, ...o.accommodation, ...o.otherCosts]);
  const text = all.map((l) => `${l.label} ${l.provider} ${l.detail}`).join(' | ');
  return {
    hasRentalCar: RENTAL_WORDS.test(text),
    hasHotel: HOTEL_WORDS.test(text),
    hasFlight: FLIGHT_WORDS.test(text),
    hasNightlife: NIGHT_WORDS.test(text),
    nights,
    cheapestPerPerson: plan.options.length
      ? Math.min(...plan.options.map((o) => o.perPersonMin))
      : 0,
  };
}

const BUDGET_CEILING: Record<ResearchRequest['budgetBand'], number> = {
  shoestring: 160,
  moderate: 320,
  comfortable: 700,
};

export function deriveConstraints(
  request: ResearchRequest,
  shape: PlanShape,
  extra: ConstraintFlag[] = [],
): ConstraintFlag[] {
  const flags: ConstraintFlag[] = [];
  const nights = Math.max(shape.nights, 0);

  /* ---------------------------------------------------------------- age */

  if (!request.isOver21 && shape.hasRentalCar) {
    flags.push({
      trigger: 'under-21',
      severity: 'blocker',
      title: 'You cannot rent the car yourself',
      body: 'Every major rental company in California sets its minimum age at 21. Under that they will not put you on the contract at all, whatever your licence says, and no amount of deposit changes it.',
      workaround:
        'Somebody 21 or over has to be the named renter and the only person who drives. If nobody in the group is, the driving options below are not open to you and the transit option is the trip.',
    });
  } else if (shape.hasRentalCar) {
    flags.push({
      trigger: 'under-21',
      severity: 'warning',
      title: 'Young driver surcharge, 21 to 24',
      body: 'Renting between 21 and 24 adds a young-driver fee of roughly $19 to $35 per day on top of the advertised rate. It is charged per rental day, not per person, and it is the single most common reason a quoted car price is wrong.',
      workaround:
        'Over three days that is $60 to $105 the comparison sites did not show you. Split it across the group and check whether the coach works out cheaper before you book.',
    });
  }

  if (!request.isOver21 && shape.hasNightlife) {
    flags.push({
      trigger: 'under-21',
      severity: 'blocker',
      title: 'You will be turned away at the door',
      body: 'Bars, clubs and casino gaming floors here are 21 and over and they scan IDs rather than glance at them. A foreign passport is fine as proof of age; being nineteen is not.',
      workaround:
        'The itinerary below has been rewritten around this. Everything in it is open to you, and the evenings lean on food, live music with all-ages billing, and places that do not check.',
    });
  }

  /* ---------------------------------------------------------------- car */

  if (!request.hasCar) {
    flags.push({
      trigger: 'no-car',
      severity: 'info',
      title: 'Costed without a car',
      body: 'You said you do not have one, so nothing below assumes access to a vehicle. Where a route only works by road, the cost of hiring or of a rideshare is shown as its own line rather than hidden in the total.',
    });
  }

  if (!request.hasUsCreditCard) {
    if (shape.hasRentalCar) {
      flags.push({
        trigger: 'no-us-credit-card',
        severity: 'blocker',
        title: 'A debit card will not get you the keys',
        body: 'Rental desks place a hold of $200 to $500 on a credit card at pickup. Most will not accept a foreign debit card at all, and the ones that do run a credit check, ask for a return flight booking, and sometimes refuse anyway once you are at the counter.',
        workaround:
          'Use the card of whoever in the group has a US credit card, and make sure that person is also the named driver — the card and the licence have to match.',
      });
    }
    if (shape.hasHotel) {
      flags.push({
        trigger: 'no-us-credit-card',
        severity: 'warning',
        title: 'Incidental holds at check-in',
        body: `Hotels take an incidental hold of $50 to $100 a night at check-in, on top of the room. For ${nights || 2} nights that is money out of your account for up to ten working days after you leave, and on a foreign debit card you also pay the exchange spread twice.`,
        workaround:
          'Hostels and Airbnbs mostly do not do this. If you are booking a hotel, put it on one person’s card and settle up in cash.',
      });
    }
  }

  if (request.hasCar) {
    flags.push({
      trigger: 'foreign-licence',
      severity: 'info',
      title: 'Your home licence is enough to drive on',
      body: 'California recognises a foreign licence for the length of a visit, so driving a car you already have access to is not a problem. An International Driving Permit is only worth carrying if your licence is not in the Latin alphabet.',
    });
  }

  /* ---------------------------------------------------------------- money */

  const ceiling = BUDGET_CEILING[request.budgetBand];
  if (shape.cheapestPerPerson > ceiling) {
    flags.push({
      trigger: 'budget',
      severity: 'warning',
      title: 'Over the budget you set',
      body: `You asked for the ${request.budgetBand === 'shoestring' ? 'cheapest possible' : request.budgetBand} band, which puts the ceiling around $${ceiling} a head. The cheapest honest version of this comes out at about $${Math.round(shape.cheapestPerPerson)}.`,
      workaround:
        'Adding two more people to the group is usually worth more than any other single change, because accommodation and fuel are the parts that split.',
    });
  }

  /* ---------------------------------------------------------------- group */

  if (request.groupSize <= 2 && shape.nights > 0) {
    flags.push({
      trigger: 'group-size',
      severity: 'warning',
      title: 'Two people is the expensive way to do this',
      body: 'Accommodation and fuel are the two costs that split, and at a group of two neither of them does much splitting. The per-head figures below are roughly a third higher than they would be at five.',
      workaround: 'Post this as a trip and let three more people join before you book anything.',
    });
  } else if (request.groupSize >= 7 && shape.hasHotel) {
    flags.push({
      trigger: 'group-size',
      severity: 'info',
      title: 'Big group, so the room maths changes',
      body: `At ${request.groupSize} people you are into a third room, or a whole apartment. The accommodation lines below assume the cheaper of the two for your group size, and say which.`,
    });
  }

  return [...flags, ...extra];
}

/**
 * Applied to live results as a floor. The model usually gets these right; when it does not,
 * silence would be the worst possible failure, so we add the missing ones back and never
 * remove what the model found.
 */
export function ensureBaselineConstraints(
  plan: ResearchPlan,
  request: ResearchRequest,
  nights: number,
): ConstraintFlag[] {
  const shape = readPlanShape(plan, nights);
  const baseline = deriveConstraints(request, shape);
  const seen = new Set(plan.constraints.map((c) => `${c.trigger}:${c.severity}`));
  const missing = baseline.filter((c) => !seen.has(`${c.trigger}:${c.severity}`));
  return [...plan.constraints, ...missing];
}
