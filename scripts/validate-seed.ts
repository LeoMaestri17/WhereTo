/**
 * Seed data invariants.
 *
 * The demo is only convincing if the seed holds together: every profile you can pick has to have
 * something to host and something to decide, every derived status has to be reachable, and no
 * membership can point at a person or a post that does not exist. These are easy to break while
 * editing content, and impossible to spot by clicking around.
 *
 * Run with `npm run validate:seed`.
 */
import { deriveQuestStatus, questCapacity } from '../lib/domain/logic';
import type { QuestStatus } from '../lib/domain/types';
import { buildAttendance, EVENT_SOURCES, loadAllEvents } from '../lib/events';
import { PHOTOS, PORTRAITS } from '../lib/seed/images';
import { IDEAS } from '../lib/seed/ideas';
import { buildMemberships, buildQuests } from '../lib/seed/quests';
import { buildFriendships, COHORT_USERS } from '../lib/seed/users';
import { FIXTURES } from '../lib/research/cached';

const failures: string[] = [];
const notes: string[] = [];

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

async function main() {
  const users = COHORT_USERS;
  const quests = buildQuests();
  const memberships = buildMemberships();
  const friendships = buildFriendships();
  const { events, failed } = await loadAllEvents();
  const attendance = buildAttendance(events);

  const userIds = new Set(users.map((u) => u.id));
  const questIds = new Set(quests.map((q) => q.id));
  const knownPhotos = new Set<string>([...Object.values(PHOTOS), ...PORTRAITS]);

  /* ---------------------------------------------------------------- people */

  check(users.length === 25, `Expected 25 cohort members, found ${users.length}`);
  check(userIds.size === users.length, 'Duplicate user ids in the cohort');
  check(
    users.every((u) => knownPhotos.has(u.photo)),
    'A cohort member has a photo id that is not in the catalogue',
  );
  check(
    users.some((u) => u.age < 21) && users.some((u) => u.age >= 21),
    'The cohort needs people on both sides of 21 — that split is the point of the product',
  );
  check(
    users.every((u) => u.interests.length >= 3),
    'Every cohort member needs at least three interests for the feed to personalise',
  );

  for (const [id, friends] of Object.entries(friendships)) {
    check(userIds.has(id), `Friendship graph references unknown user ${id}`);
    check(!friends.includes(id), `${id} is listed as their own friend`);
    for (const friend of friends) {
      check(userIds.has(friend), `${id} is friends with unknown user ${friend}`);
      check(
        (friendships[friend] ?? []).includes(id),
        `Friendship between ${id} and ${friend} is not symmetric`,
      );
    }
  }
  check(
    users.every((u) => (friendships[u.id] ?? []).length >= 3),
    'Everyone needs at least three friends, or the attendance line renders with no names in it',
  );

  /* ---------------------------------------------------------------- quests */

  check(quests.length >= 25, `Expected at least 25 quests, found ${quests.length}`);
  check(questIds.size === quests.length, 'Duplicate quest ids');

  for (const q of quests) {
    check(userIds.has(q.hostId), `${q.id} is hosted by unknown user ${q.hostId}`);
    check(knownPhotos.has(q.cover), `${q.id} has a cover photo that is not in the catalogue`);
    check(q.description.trim().length > 80, `${q.id} needs a description a person would write`);
    check(q.meetingPoint.trim().length > 3, `${q.id} has no meeting point`);
    check(q.tags.length > 0, `${q.id} has no tags, so it will never match an interest`);

    const capacity = questCapacity(q, memberships);
    check(
      capacity.taken <= capacity.capacity,
      `${q.id} has ${capacity.taken} people in ${capacity.capacity} spots — oversubscribed`,
    );
    if (q.kind === 'trip') {
      check(Boolean(q.endDate), `${q.id} is a trip with no end date`);
    }
    if (q.lifecycle === 'completed') {
      check(Boolean(q.actuals), `${q.id} is completed but reports no actuals`);
    }
  }

  for (const m of memberships) {
    check(questIds.has(m.questId), `Membership points at unknown quest ${m.questId}`);
    check(userIds.has(m.userId), `Membership points at unknown user ${m.userId}`);
    const quest = quests.find((q) => q.id === m.questId);
    check(quest?.hostId !== m.userId, `${m.userId} is both host and member of ${m.questId}`);
  }

  const seen = new Set<string>();
  for (const m of memberships) {
    const key = `${m.questId}:${m.userId}`;
    check(!seen.has(key), `Duplicate membership for ${key}`);
    seen.add(key);
  }

  /* ------------------------------------------------ every profile is playable */

  const hostsWithPending = new Set(
    memberships
      .filter((m) => m.state === 'requested')
      .map((m) => quests.find((q) => q.id === m.questId)?.hostId)
      .filter(Boolean) as string[],
  );

  for (const u of users) {
    const hostsActive = quests.some((q) => q.hostId === u.id && q.lifecycle === 'active');
    check(hostsActive, `${u.name} hosts no active quest, so their host console would be empty`);

    // Hosting something *joinable* is what makes approve and decline reachable. A host whose
    // only post is full or past its deadline can never exercise that flow.
    const hostsJoinable = quests.some(
      (q) => q.hostId === u.id && ['open', 'filling'].includes(deriveQuestStatus(q, memberships)),
    );
    check(
      hostsJoinable,
      `${u.name} hosts nothing joinable, so approve/decline is unreachable on their profile`,
    );

    check(
      hostsWithPending.has(u.id),
      `${u.name} has no request waiting on them, so the host console has nothing to decide`,
    );

    const approved = memberships.some((m) => m.userId === u.id && m.state === 'approved');
    check(approved, `${u.name} has joined nothing, so the "you are going" state is unreachable`);

    const requested = memberships.some((m) => m.userId === u.id && m.state === 'requested');
    check(
      requested,
      `${u.name} has no pending request, so the "already requested" state is unreachable`,
    );
  }

  /* ---------------------------------------------------------------- statuses */

  const statuses = new Set<QuestStatus>(quests.map((q) => deriveQuestStatus(q, memberships)));
  for (const required of [
    'open',
    'filling',
    'full',
    'closed',
    'cancelled',
    'completed',
  ] as QuestStatus[]) {
    check(statuses.has(required), `No seeded quest derives the "${required}" status`);
  }

  /* ------------------------------------------------ visibility */

  const privateQuests = quests.filter((q) => q.visibility === 'private');
  check(privateQuests.length >= 1, 'No seeded quest is private, so that state is unreachable');
  for (const q of privateQuests) {
    check(
      q.invitedUserIds.length >= 1,
      `${q.id} is private but nobody is invited, so only the host can ever see it`,
    );
    check(Boolean(q.inviteCode), `${q.id} is private but has no invite code to share`);
    for (const id of q.invitedUserIds) {
      check(userIds.has(id), `${q.id} invites unknown user ${id}`);
      check(id !== q.hostId, `${q.id} invites its own host`);
    }
  }
  check(
    quests.some((q) => q.visibility === 'public'),
    'Every quest is private, so the public feed would be empty',
  );

  const completed = quests.filter((q) => q.lifecycle === 'completed');
  check(completed.length >= 3, `Expected at least 3 completed trips with actuals, found ${completed.length}`);
  for (const q of completed) {
    check(
      (q.actuals?.lineItems.length ?? 0) >= 4,
      `${q.id} needs a proper line-by-line breakdown of what it actually cost`,
    );
    check(
      (q.actuals?.hostNote.length ?? 0) > 60,
      `${q.id} needs a host note explaining what moved`,
    );
  }

  /* ---------------------------------------------------------------- ideas */

  check(IDEAS.length >= 15, `Expected at least 15 ideas, found ${IDEAS.length}`);
  for (const shape of ['day', 'weekend', 'break'] as const) {
    const group = IDEAS.filter((i) => i.shape === shape);
    check(group.length >= 4, `Only ${group.length} ideas in the "${shape}" shape`);
  }
  for (const idea of IDEAS) {
    check(knownPhotos.has(idea.image), `Idea ${idea.slug} has an unknown photo id`);
    check(idea.hook.trim().length > 30, `Idea ${idea.slug} needs a real hook`);
  }
  const ideaSlugs = new Set(IDEAS.map((i) => i.slug));
  check(ideaSlugs.size === IDEAS.length, 'Duplicate idea slugs');

  /* ---------------------------------------------------------------- research fixtures */

  check(FIXTURES.length >= 4, `Expected at least 4 cached plans, found ${FIXTURES.length}`);
  const fixtureShapes = new Set(
    FIXTURES.map((f) => IDEAS.find((i) => i.slug === f.ideaSlug)?.shape),
  );
  for (const shape of ['day', 'weekend', 'break'] as const) {
    check(fixtureShapes.has(shape), `No cached plan covers the "${shape}" shape`);
  }
  for (const f of FIXTURES) {
    check(ideaSlugs.has(f.ideaSlug), `Cached plan ${f.ideaSlug} has no matching idea`);
    check(f.options.length >= 2, `Cached plan ${f.ideaSlug} needs two or three options`);
    check(f.itinerary.length > 0, `Cached plan ${f.ideaSlug} has no itinerary`);
    check(f.assumptions.length >= 3, `Cached plan ${f.ideaSlug} needs its assumptions stated`);
    check(f.exclusions.length >= 3, `Cached plan ${f.ideaSlug} needs its exclusions stated`);
    for (const option of f.options) {
      const lines = [...option.transport, ...option.accommodation, ...option.otherCosts];
      check(lines.length > 0, `Option ${f.ideaSlug}/${option.id} has no costed lines`);
      for (const line of lines) {
        check(
          line.basis.trim().length > 5,
          `Line "${line.label}" in ${f.ideaSlug} states no assumption`,
        );
        check(
          line.provider.trim().length > 1,
          `Line "${line.label}" in ${f.ideaSlug} names no provider`,
        );
      }
    }
  }

  /* ---------------------------------------------------------------- events */

  check(failed.length === 0, `Event sources failed: ${failed.map((f) => f.label).join(', ')}`);
  check(events.length >= 20, `Expected at least 20 events, found ${events.length}`);
  for (const source of EVENT_SOURCES) {
    const fromSource = events.filter((e) => e.source === source.id);
    check(fromSource.length >= 5, `Source ${source.label} returned only ${fromSource.length} events`);
    check(
      source.realIntegration.trim().length > 10,
      `Source ${source.label} does not name what would replace it`,
    );
  }
  for (const e of events) {
    check(knownPhotos.has(e.image), `Event ${e.id} has an unknown photo id`);
    check(e.url.startsWith('http'), `Event ${e.id} has no usable link`);
    check(e.tags.length > 0, `Event ${e.id} has no tags`);
    check(e.description.trim().length > 50, `Event ${e.id} needs a real description`);
  }

  const eventIds = new Set(events.map((e) => e.id));
  for (const a of attendance) {
    check(eventIds.has(a.eventId), `Attendance points at unknown event ${a.eventId}`);
    check(userIds.has(a.userId), `Attendance points at unknown user ${a.userId}`);
  }
  const eventsWithGoing = new Set(
    attendance.filter((a) => a.state === 'going').map((a) => a.eventId),
  );
  check(
    eventsWithGoing.size === events.length,
    'Some events have nobody going, so the attendance line renders empty',
  );

  // Under-21s should never be seeded as going to a door that will refuse them.
  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  for (const a of attendance) {
    const event = events.find((e) => e.id === a.eventId);
    if (event?.is21Plus && a.state === 'going') {
      check(
        (usersById[a.userId]?.age ?? 0) >= 21,
        `${usersById[a.userId]?.name} is under 21 and seeded as going to a 21+ event`,
      );
    }
  }

  /* ---------------------------------------------------------------- report */

  notes.push(`${users.length} cohort members, ${Object.keys(friendships).length} in the graph`);
  notes.push(
    `${quests.length} quests (${quests.filter((q) => q.kind === 'trip').length} trips, ${
      quests.filter((q) => q.kind === 'activity').length
    } activities), statuses seen: ${[...statuses].sort().join(', ')}`,
  );
  notes.push(
    `${memberships.filter((m) => m.state === 'approved').length} approved memberships, ${
      memberships.filter((m) => m.state === 'requested').length
    } pending requests across ${hostsWithPending.size} hosts`,
  );
  notes.push(`${IDEAS.length} ideas, ${FIXTURES.length} cached research plans`);
  notes.push(`${events.length} events from ${EVENT_SOURCES.length} sources, ${attendance.length} attendance records`);

  for (const note of notes) console.log(`  ${note}`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} seed problem${failures.length === 1 ? '' : 's'}:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\nSeed data is consistent.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
