import { mockCall } from './client';
import type { EventDraft, LiveEvent, Attendee, JoinRequest } from '../types/event';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEFAULT_GRADIENT =
  'linear-gradient(145deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)';

const defaultQuickLinks = [
  { id: 'capacity', label: 'Capacity', enabled: false },
  { id: 'gallery', label: 'Photo gallery', enabled: false },
  { id: 'links', label: 'Links', enabled: false },
  { id: 'privacy', label: 'Privacy', enabled: false },
];

// Local draft storage (kept in memory/localStorage for creation flow)
const db: { draft: EventDraft } = {
  draft: {
    name: '',
    description: '',
    flyerUrl: undefined,
    backgroundUrl: DEFAULT_GRADIENT,
    quickLinks: defaultQuickLinks,
    capacity: undefined,
    links: [],
    dateTime: undefined,
    location: undefined,
    costPerPerson: undefined,
    phone: undefined,
    gallery: [],
    category: undefined,
    tags: [],
    isPrivate: false,
  },
};

function applyPatch(current: EventDraft, patch: Partial<EventDraft>): EventDraft {
  const result = { ...current };
  for (const key of Object.keys(patch) as (keyof EventDraft)[]) {
    const value = patch[key];
    if (value !== undefined) {
      (result as Record<keyof EventDraft, unknown>)[key] = value;
    }
  }
  return result;
}

// API helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const token = localStorage.getItem('lets_hang_token');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { ok: false, error: data.message || 'Request failed' };
    }
    
    return { ok: true, data };
  } catch (error) {
    console.error('API call failed:', error);
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}

// Transform backend event to frontend format
function transformEvent(event: Record<string, unknown>): LiveEvent {
  return {
    id: (event._id as string) || (event.id as string),
    name: event.name as string,
    description: event.description as string,
    flyerUrl: event.flyerUrl as string,
    dateTime: event.date as string,
    date: event.date as string,
    location: event.location as string,
    hostId: event.hostId as string,
    hostName: event.hostName as string,
    hostAvatar: event.hostAvatar as string,
    attendeeCount: (event.attendees as unknown[])?.length || 0,
    capacity: event.capacity as number,
    category: event.category as LiveEvent['category'],
    tags: (event.tags as string[]) || [],
    isPrivate: event.isPrivate as boolean,
    costPerPerson: event.costPerPerson as number,
    attendees: ((event.attendees as Record<string, unknown>[]) || []).map(a => ({
      id: a.id as string,
      oderId: a.id as string,
      userId: a.id as string,
      userName: a.name as string,
      userAvatar: a.avatar as string,
      joinedAt: a.joinedAt as string,
      paidAmount: a.amountPaid as number,
    })) as Attendee[],
    joinRequests: ((event.joinRequests as Record<string, unknown>[]) || []).map(r => ({
      id: r.id as string,
      oderId: r.id as string,
      userId: r.id as string,
      userName: r.name as string,
      userAvatar: r.avatar as string,
      requestedAt: r.requestedAt as string,
      status: r.status as 'pending' | 'approved' | 'rejected',
      paidAmount: r.amountPaid as number,
    })) as JoinRequest[],
    status: event.status as LiveEvent['status'],
    payoutStatus: event.payoutStatus as LiveEvent['payoutStatus'],
    totalCollected: event.totalCollected as number,
    platformFee: event.platformFee as number,
    hostEarnings: event.hostEarnings as number,
    payoutCompletedAt: event.payoutCompletedAt as string,
  };
}

export type SearchFilters = {
  query?: string;
  category?: LiveEvent['category'] | 'all';
};

export const eventApi = {
  // Draft management (local)
  getDraft: () => mockCall(() => db.draft),

  saveDraft: (patch: Partial<EventDraft>) =>
    mockCall(() => {
      db.draft = applyPatch(db.draft, patch);
      return db.draft;
    }),

  // Get all live events from backend
  getLiveEvents: async (filters?: SearchFilters): Promise<{ ok: true; data: LiveEvent[] } | { ok: false; error: string }> => {
    const params = new URLSearchParams();
    if (filters?.query) params.append('search', filters.query);
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    
    const result = await apiCall<{ events: Record<string, unknown>[] }>(`/events?${params.toString()}`);
    
    if (!result.ok) return result;
    
    return {
      ok: true,
      data: result.data.events.map(transformEvent),
    };
  },

  // Get single event by ID
  getEventById: async (id: string): Promise<{ ok: true; data: LiveEvent } | { ok: false; error: string }> => {
    const result = await apiCall<{ event: Record<string, unknown> }>(`/events/${id}`);
    
    if (!result.ok) return result;
    
    return {
      ok: true,
      data: transformEvent(result.data.event),
    };
  },

  // Publish a new event
  publishEvent: async (_hostInfo: { id: string; name: string; avatar?: string }): Promise<{ ok: true; data: LiveEvent } | { ok: false; error: string }> => {
    const draft = db.draft;
    
    if (!draft.name?.trim()) {
      return { ok: false, error: 'Event name is required' };
    }

    // Parse cost from string to cents
    let costInCents = 0;
    if (draft.costPerPerson) {
      const parsed = parseFloat(draft.costPerPerson.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        costInCents = Math.round(parsed * 100);
      }
    }

    const result = await apiCall<{ event: Record<string, unknown> }>('/events', {
      method: 'POST',
      body: JSON.stringify({
        // Basic info
        name: draft.name,
        description: draft.description,
        date: draft.dateTime || new Date().toISOString(),
        endDate: draft.endDateTime,
        location: draft.location || 'Location TBD',
        venueDetails: draft.venueDetails,
        
        // Media
        flyerUrl: draft.flyerUrl,
        backgroundUrl: draft.backgroundUrl,
        gallery: draft.gallery || [],
        links: draft.links || [],
        quickLinks: draft.quickLinks || [],
        
        // Ticket Tiers
        ticketTiers: draft.ticketTiers || [],
        hasMultipleTiers: draft.hasMultipleTiers || false,
        
        // Legacy pricing (for single tier)
        capacity: draft.capacity || 50,
        costPerPerson: costInCents,
        
        // Add-ons
        addOns: draft.addOns || [],
        
        // Custom Questions
        customQuestions: draft.customQuestions || [],
        
        // Categorization
        category: draft.category || 'other',
        tags: draft.tags || [],
        
        // Privacy
        privacyType: draft.privacyType || 'public',
        isPrivate: draft.isPrivate || draft.privacyType !== 'public',
        eventPassword: draft.eventPassword,
        
        // Plus-ones
        allowPlusOnes: draft.allowPlusOnes || false,
        maxPlusOnes: draft.maxPlusOnes || 1,
        plusOneCost: draft.plusOneCost || 0,
        
        // Group registration
        allowGroupRegistration: draft.allowGroupRegistration || false,
        minGroupSize: draft.minGroupSize || 2,
        maxGroupSize: draft.maxGroupSize || 10,
        groupDiscount: draft.groupDiscount || 0,
      }),
    });

    if (!result.ok) return result;

    // Reset draft
    db.draft = {
      name: '',
      description: '',
      flyerUrl: undefined,
      backgroundUrl: DEFAULT_GRADIENT,
      quickLinks: defaultQuickLinks,
      capacity: undefined,
      links: [],
      dateTime: undefined,
      endDateTime: undefined,
      location: undefined,
      venueDetails: undefined,
      costPerPerson: undefined,
      phone: undefined,
      gallery: [],
      category: undefined,
      tags: [],
      isPrivate: false,
      // Ticket Tiers
      ticketTiers: undefined,
      hasMultipleTiers: false,
      // Add-ons
      addOns: undefined,
      // Custom Questions
      customQuestions: undefined,
      // Privacy
      privacyType: undefined,
      eventPassword: undefined,
      // Plus-ones
      allowPlusOnes: false,
      maxPlusOnes: 1,
      plusOneCost: 0,
      // Group registration
      allowGroupRegistration: false,
      minGroupSize: 2,
      maxGroupSize: 10,
      groupDiscount: 0,
    };

    return {
      ok: true,
      data: transformEvent(result.data.event),
    };
  },

  // Join a public event
  joinEvent: async (eventId: string, _user: { id: string; name: string; avatar?: string }, paidAmount: number, paymentId?: string, ticketCount: number = 1): Promise<{ ok: true; data: { message: string } } | { ok: false; error: string }> => {
    const result = await apiCall<{ message: string }>(`/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify({ paymentId, amountPaid: paidAmount, ticketCount }),
    });
    
    return result.ok 
      ? { ok: true, data: { message: result.data.message } }
      : result;
  },

  // Request to join a private event
  requestToJoin: async (eventId: string, _user: { id: string; name: string; avatar?: string }, paidAmount: number, paymentId?: string): Promise<{ ok: true; data: { message: string } } | { ok: false; error: string }> => {
    const result = await apiCall<{ message: string }>(`/events/${eventId}/request`, {
      method: 'POST',
      body: JSON.stringify({ paymentId, amountPaid: paidAmount }),
    });
    
    return result.ok 
      ? { ok: true, data: { message: result.data.message } }
      : result;
  },

  // Check user's status for an event
  getUserEventStatus: async (eventId: string, _userId: string): Promise<{ ok: true; data: { status: 'host' | 'joined' | 'pending' | 'none'; attendee?: Attendee } } | { ok: false; error: string }> => {
    const result = await apiCall<{ status: 'host' | 'joined' | 'pending' | 'none'; attendee?: Record<string, unknown> }>(`/events/${eventId}/status`);
    
    if (!result.ok) return result;
    
    return {
      ok: true,
      data: {
        status: result.data.status,
        attendee: result.data.attendee ? {
          id: result.data.attendee.id as string,
          oderId: result.data.attendee.id as string,
          userId: result.data.attendee.id as string,
          userName: result.data.attendee.name as string,
          userAvatar: result.data.attendee.avatar as string,
          joinedAt: result.data.attendee.joinedAt as string,
          paidAmount: result.data.attendee.amountPaid as number,
        } as Attendee : undefined,
      },
    };
  },

  // Cancel attendance
  cancelAttendance: async (eventId: string, _userId: string): Promise<{ ok: true; data: { message: string; refundAmount: number; paymentId?: string } } | { ok: false; error: string }> => {
    const result = await apiCall<{ message: string; refundAmount: number; paymentId?: string }>(`/events/${eventId}/cancel`, {
      method: 'POST',
    });
    
    return result.ok 
      ? { ok: true, data: result.data }
      : result;
  },

  // Cancel join request
  cancelJoinRequest: async (eventId: string, _userId: string): Promise<{ ok: true; data: { message: string; refundAmount: number } } | { ok: false; error: string }> => {
    const result = await apiCall<{ message: string; refundAmount: number }>(`/events/${eventId}/cancel`, {
      method: 'POST',
    });
    
    return result.ok 
      ? { ok: true, data: result.data }
      : result;
  },

  // Mark event as completed
  markEventCompleted: async (eventId: string, _hostId: string): Promise<{ ok: true; data: { message: string } } | { ok: false; error: string }> => {
    const result = await apiCall<{ message: string }>(`/events/${eventId}/complete`, {
      method: 'POST',
    });
    
    return result.ok 
      ? { ok: true, data: result.data }
      : result;
  },

  // Request payout
  requestPayout: async (eventId: string, _hostId: string): Promise<{ ok: true; data: { message: string; amount: number } } | { ok: false; error: string }> => {
    const result = await apiCall<{ message: string; amount: number }>(`/events/${eventId}/payout`, {
      method: 'POST',
    });
    
    return result.ok 
      ? { ok: true, data: result.data }
      : result;
  },

  // Get events hosted by user
  getHostedEvents: async (userId: string): Promise<{ ok: true; data: LiveEvent[] } | { ok: false; error: string }> => {
    const result = await apiCall<{ events: Record<string, unknown>[] }>('/events/user/hosted');
    
    if (!result.ok) return result;
    
    return {
      ok: true,
      data: result.data.events.map(transformEvent),
    };
  },

  // Get events user is attending
  getAttendingEvents: async (userId: string): Promise<{ ok: true; data: LiveEvent[] } | { ok: false; error: string }> => {
    const result = await apiCall<{ events: Record<string, unknown>[] }>('/events/user/attending');
    
    if (!result.ok) return result;
    
    return {
      ok: true,
      data: result.data.events.map(transformEvent),
    };
  },

  // Update event
  updateEvent: async (eventId: string, hostId: string, updates: Partial<Pick<LiveEvent, 'name' | 'description' | 'dateTime' | 'location' | 'capacity' | 'costPerPerson' | 'category' | 'tags' | 'isPrivate' | 'flyerUrl'>>): Promise<{ ok: true; data: LiveEvent } | { ok: false; error: string }> => {
    const result = await apiCall<{ event: Record<string, unknown> }>(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        date: updates.dateTime,
      }),
    });
    
    if (!result.ok) return result;
    
    return {
      ok: true,
      data: transformEvent(result.data.event),
    };
  },

  // Update host profile (syncs across events)
  updateHostProfile: async (hostId: string, updates: { name?: string; avatar?: string }): Promise<{ ok: true; data: { updated: number } } | { ok: false; error: string }> => {
    // This is handled automatically by the backend when user profile is updated
    return { ok: true, data: { updated: 0 } };
  },
};
