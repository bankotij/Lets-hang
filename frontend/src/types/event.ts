export type QuickLink = {
  id: string;
  label: string;
  url?: string;
  enabled: boolean;
};

export type EventLink = {
  id: string;
  url: string;
};

export type GalleryImage = {
  id: string;
  url: string;
};

export type EventCategory = 
  | 'party' | 'music' | 'food' | 'sports' | 'art' | 'tech' 
  | 'social' | 'wedding' | 'corporate' | 'sports-tournament' | 'workshop' | 'other';

// ==================== TICKET TIERS ====================
export type TicketTier = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  price: number; // in cents
  quantity: number;
  sold: number;
  perks: string[];
  sortOrder: number;
};

// ==================== ADD-ONS ====================
export type AddOn = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  quantity?: number; // null = unlimited
  sold: number;
  description?: string;
};

// ==================== CUSTOM QUESTIONS ====================
export type CustomQuestion = {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
  options?: string[];
  required: boolean;
};

export type QuestionResponse = {
  questionId: string;
  question: string;
  answer: string;
};

// ==================== PLUS-ONES ====================
export type PlusOne = {
  name: string;
  email?: string;
};

// ==================== PRIVACY ====================
export type PrivacyType = 'public' | 'private' | 'invite-only' | 'password';

export type GuestListEntry = {
  email: string;
  name?: string;
  invitedAt: string;
  status: 'invited' | 'registered' | 'declined';
  plusOnesAllowed: number;
};

// ==================== EVENT DRAFT ====================
export type EventDraft = {
  name: string;
  description?: string;
  flyerUrl?: string;
  backgroundUrl?: string;
  quickLinks: QuickLink[];
  capacity?: number;
  links: EventLink[];
  gallery: GalleryImage[];
  dateTime?: string;
  endDateTime?: string;
  location?: string;
  venueDetails?: string;
  costPerPerson?: string;
  phone?: string;
  category?: EventCategory;
  tags: string[];
  isPrivate?: boolean;
  // New fields
  ticketTiers?: TicketTier[];
  hasMultipleTiers?: boolean;
  addOns?: AddOn[];
  customQuestions?: CustomQuestion[];
  privacyType?: PrivacyType;
  eventPassword?: string;
  inviteCode?: string;
  allowPlusOnes?: boolean;
  maxPlusOnes?: number;
  plusOneCost?: number;
  allowGroupRegistration?: boolean;
  minGroupSize?: number;
  maxGroupSize?: number;
  groupDiscount?: number;
};

// ==================== JOIN REQUEST ====================
export type JoinRequest = {
  id: string;
  oderId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  paidAmount: number;
  ticketTierId?: string;
  ticketTierName?: string;
  ticketCount?: number;
  responses?: QuestionResponse[];
};

// ==================== ATTENDEE ====================
export type AttendeeAddOn = {
  addOnId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Attendee = {
  id: string;
  oderId?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  joinedAt: string;
  paidAmount: number;
  ticketCount?: number;
  // Ticket tier
  ticketTierId?: string;
  ticketTierName?: string;
  // Add-ons
  addOns?: AttendeeAddOn[];
  // Responses
  responses?: QuestionResponse[];
  // Plus-ones
  plusOnes?: PlusOne[];
  // Check-in
  checkedIn?: boolean;
  checkedInAt?: string;
  // Group
  groupName?: string;
  isGroupLeader?: boolean;
};

// ==================== WAITLIST ====================
export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  ticketTierId?: string;
  joinedAt: string;
};

// ==================== EVENT STATUS ====================
export type EventStatus = 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type PayoutStatus = 'pending' | 'processing' | 'paid';

// ==================== LIVE EVENT ====================
export type LiveEvent = {
  id: string;
  name: string;
  description?: string;
  flyerUrl?: string;
  backgroundUrl?: string;
  gallery?: GalleryImage[];
  links?: EventLink[];
  quickLinks?: QuickLink[];
  dateTime: string;
  date?: string;
  endDate?: string;
  location: string;
  venueDetails?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  hostEmail?: string;
  attendeeCount: number;
  capacity?: number;
  category: EventCategory;
  tags: string[];
  
  // Ticket Tiers
  ticketTiers?: TicketTier[];
  hasMultipleTiers?: boolean;
  
  // Add-ons
  addOns?: AddOn[];
  
  // Custom Questions
  customQuestions?: CustomQuestion[];
  
  // Privacy
  privacyType?: PrivacyType;
  isPrivate: boolean;
  inviteCode?: string;
  eventPassword?: string;
  guestList?: GuestListEntry[];
  
  // Plus-ones
  allowPlusOnes?: boolean;
  maxPlusOnes?: number;
  plusOneCost?: number;
  
  // Group registration
  allowGroupRegistration?: boolean;
  minGroupSize?: number;
  maxGroupSize?: number;
  groupDiscount?: number;
  
  // Legacy pricing
  costPerPerson: number;
  
  // Attendees
  attendees: Attendee[];
  joinRequests: JoinRequest[];
  waitlist?: WaitlistEntry[];
  
  // Status
  status: EventStatus;
  payoutStatus: PayoutStatus;
  totalCollected: number;
  platformFee: number;
  hostEarnings: number;
  payoutCompletedAt?: string;
};

// Constants
export const CANCELLATION_FEE_PERCENT = 10;

// Default ticket tiers templates
export const DEFAULT_TIER_TEMPLATES = [
  { name: 'General', emoji: '🎫', color: '#6b7280', perks: ['Standard entry'] },
  { name: 'VIP', emoji: '⭐', color: '#eab308', perks: ['Priority entry', 'VIP section access'] },
  { name: 'Diamond', emoji: '💎', color: '#3b82f6', perks: ['Meet & greet', 'Exclusive merch', 'Photo opportunity'] },
  { name: 'Platinum', emoji: '👑', color: '#8b5cf6', perks: ['All access pass', 'Backstage access', 'Signed merchandise'] },
  { name: 'Fan Pit', emoji: '🔥', color: '#ef4444', perks: ['Front row standing', 'Early entry'] },
];

// Default add-on templates
export const DEFAULT_ADDON_TEMPLATES = [
  { name: 'Parking Pass', emoji: '🚗', description: 'Reserved parking spot' },
  { name: 'Meal Package', emoji: '🍽️', description: 'Food and drinks included' },
  { name: 'T-Shirt', emoji: '👕', description: 'Event merchandise' },
  { name: 'Photo Package', emoji: '📸', description: 'Professional photos' },
  { name: 'VIP Lounge', emoji: '🛋️', description: 'Access to VIP lounge' },
];
