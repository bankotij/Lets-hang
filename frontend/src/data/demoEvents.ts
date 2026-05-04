import type { EventCategory, LiveEvent } from '../types/event';
import type { SearchFilters } from '../types/catalogFilters';
import { getCategoryCoverGradient } from '../utils/categoryGradients';

export type DemoEventSeed = {
  id: string;
  title: string;
  host: string;
  category: EventCategory;
  location: string;
  /** ISO 8601 */
  dateTimeIso: string;
  /** Stored as USD cents for `formatPrice` / currency layer */
  priceUsdCents: number;
  attendees: number;
  capacity: number;
  description: string;
  tags: string[];
};

export const demoEventSeeds: DemoEventSeed[] = [
  {
    id: 'evt-001',
    title: 'Rooftop Music Night',
    host: 'Skyline Social Club',
    category: 'music',
    location: 'Delhi',
    dateTimeIso: '2026-05-18T20:00:00+05:30',
    priceUsdCents: 963,
    attendees: 128,
    capacity: 180,
    description: 'Live indie music, city views, and a curated evening crowd.',
    tags: ['live', 'indie', 'rooftop'],
  },
  {
    id: 'evt-002',
    title: 'Tech Builders Mixer',
    host: 'Founders Circle',
    category: 'tech',
    location: 'Gurugram',
    dateTimeIso: '2026-05-21T18:30:00+05:30',
    priceUsdCents: 0,
    attendees: 86,
    capacity: 120,
    description: 'A relaxed meetup for founders, engineers, and product builders.',
    tags: ['networking', 'startup', 'product'],
  },
  {
    id: 'evt-003',
    title: 'Weekend Food Walk',
    host: 'Old Town Eats',
    category: 'food',
    location: 'Noida',
    dateTimeIso: '2026-05-24T17:00:00+05:30',
    priceUsdCents: 602,
    attendees: 64,
    capacity: 80,
    description: 'Explore local food spots with a small curated group.',
    tags: ['walking-tour', 'local', 'tasting'],
  },
  {
    id: 'evt-004',
    title: 'Founder Coffee Meetup',
    host: 'Morning Builders',
    category: 'social',
    location: 'Bengaluru',
    dateTimeIso: '2026-05-19T08:00:00+05:30',
    priceUsdCents: 241,
    attendees: 42,
    capacity: 50,
    description: 'Early caffeine, quick intros, and honest builder conversations.',
    tags: ['coffee', 'founders', 'morning'],
  },
  {
    id: 'evt-005',
    title: 'Indie Film Screening',
    host: 'Projector Society',
    category: 'art',
    location: 'Mumbai',
    dateTimeIso: '2026-05-22T19:30:00+05:30',
    priceUsdCents: 482,
    attendees: 95,
    capacity: 110,
    description: 'Short films + director Q&A in an intimate theatre setting.',
    tags: ['film', 'indie', 'q&a'],
  },
  {
    id: 'evt-006',
    title: 'Art & Wine Evening',
    host: 'Studio Nine',
    category: 'art',
    location: 'Pune',
    dateTimeIso: '2026-05-25T19:00:00+05:30',
    priceUsdCents: 1204,
    attendees: 48,
    capacity: 60,
    description: 'Gallery walk, guided tasting flight, and slow conversation.',
    tags: ['wine', 'gallery', 'evening'],
  },
  {
    id: 'evt-007',
    title: 'Sunrise Yoga Session',
    host: 'Coastal Wellness',
    category: 'sports',
    location: 'Goa',
    dateTimeIso: '2026-05-20T06:30:00+05:30',
    priceUsdCents: 362,
    attendees: 36,
    capacity: 45,
    description: 'Ocean breeze, guided flow, and a calm start to the day.',
    tags: ['wellness', 'outdoor', 'morning'],
  },
  {
    id: 'evt-008',
    title: 'Standup Comedy Night',
    host: 'Late Night Mic',
    category: 'social',
    location: 'Hyderabad',
    dateTimeIso: '2026-05-23T21:00:00+05:30',
    priceUsdCents: 723,
    attendees: 156,
    capacity: 200,
    description: 'Regional comics, tight sets, and a room built for laughter.',
    tags: ['comedy', 'night-out', 'live'],
  },
  {
    id: 'evt-009',
    title: 'Midnight Rooftop Party',
    host: 'District Collective',
    category: 'party',
    location: 'Delhi',
    dateTimeIso: '2026-05-26T22:00:00+05:30',
    priceUsdCents: 1446,
    attendees: 210,
    capacity: 280,
    description: 'DJ sets, city lights, and a dressed-up crowd—RSVP only.',
    tags: ['dj', 'nightlife', 'city'],
  },
  {
    id: 'evt-010',
    title: 'Design Systems Workshop',
    host: 'Craft UI Guild',
    category: 'workshop',
    location: 'Chennai',
    dateTimeIso: '2026-05-27T10:00:00+05:30',
    priceUsdCents: 1924,
    attendees: 28,
    capacity: 32,
    description: 'Hands-on tokens, accessibility checks, and shipping patterns.',
    tags: ['design-systems', 'accessibility', 'hands-on'],
  },
  {
    id: 'evt-011',
    title: 'Corporate Leadership Breakfast',
    host: 'Summit Partners',
    category: 'corporate',
    location: 'Mumbai',
    dateTimeIso: '2026-05-28T08:30:00+05:30',
    priceUsdCents: 2410,
    attendees: 54,
    capacity: 70,
    description: 'Closed-door topics on scale, hiring, and operating cadence.',
    tags: ['leadership', 'b2b', 'breakfast'],
  },
];

const DEMO_HOST_ID = 'demo-host-portfolio';

function seedToLiveEvent(seed: DemoEventSeed): LiveEvent {
  const backgroundUrl = getCategoryCoverGradient(seed.category);
  return {
    id: seed.id,
    name: seed.title,
    description: seed.description,
    flyerUrl: undefined,
    backgroundUrl,
    dateTime: seed.dateTimeIso,
    date: seed.dateTimeIso,
    location: seed.location,
    hostId: DEMO_HOST_ID,
    hostName: seed.host,
    hostAvatar: undefined,
    attendeeCount: seed.attendees,
    capacity: seed.capacity,
    category: seed.category,
    tags: seed.tags,
    isPrivate: false,
    costPerPerson: seed.priceUsdCents,
    attendees: [],
    joinRequests: [],
    status: 'upcoming',
    payoutStatus: 'pending',
    totalCollected: 0,
    platformFee: 0,
    hostEarnings: 0,
  };
}

const liveCache: LiveEvent[] = demoEventSeeds.map(seedToLiveEvent);

export function getAllDemoLiveEvents(): LiveEvent[] {
  return liveCache;
}

export const DEMO_EVENT_IDS = new Set(demoEventSeeds.map((s) => s.id));

export function isPortfolioDemoEventId(id: string): boolean {
  return DEMO_EVENT_IDS.has(id);
}

export function getDemoLiveEventById(id: string): LiveEvent | undefined {
  return liveCache.find((e) => e.id === id);
}

function matchesQuery(event: LiveEvent, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [
    event.name,
    event.hostName,
    event.location,
    event.description ?? '',
    ...event.tags,
  ]
    .join(' ')
    .toLowerCase();
  return blob.includes(s);
}

export function filterDemoLiveEvents(
  events: LiveEvent[],
  filters: SearchFilters | undefined,
): LiveEvent[] {
  let list = events;
  const cat = filters?.category;
  if (cat && cat !== 'all') {
    list = list.filter((e) => e.category === cat);
  }
  const q = filters?.query;
  if (q) {
    list = list.filter((e) => matchesQuery(e, q));
  }
  return list;
}
