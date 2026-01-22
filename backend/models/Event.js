import mongoose from 'mongoose';

// ==================== TICKET TIERS ====================
const ticketTierSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }, // e.g., "VIP", "Diamond", "Fan Pit"
  emoji: { type: String, default: '🎫' },
  color: { type: String, default: '#8b5cf6' }, // hex color
  price: { type: Number, required: true }, // in cents
  quantity: { type: Number, required: true },
  sold: { type: Number, default: 0 },
  perks: [{ type: String }], // list of benefits
  sortOrder: { type: Number, default: 0 },
});

// ==================== ADD-ONS ====================
const addOnSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }, // e.g., "T-Shirt", "Meal", "Parking"
  emoji: { type: String, default: '🎁' },
  price: { type: Number, required: true }, // in cents
  quantity: { type: Number }, // null = unlimited
  sold: { type: Number, default: 0 },
  description: { type: String },
});

// ==================== CUSTOM QUESTIONS ====================
const customQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'textarea', 'select', 'checkbox', 'radio'],
    default: 'text'
  },
  options: [{ type: String }], // for select/radio/checkbox
  required: { type: Boolean, default: false },
});

// ==================== ATTENDEE ====================
const attendeeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  avatar: { type: String },
  joinedAt: { type: Date, default: Date.now },
  paymentId: { type: String },
  paymentIds: [{ type: String }],
  amountPaid: { type: Number, default: 0 },
  ticketCount: { type: Number, default: 1 },
  // Ticket tier info
  ticketTierId: { type: String },
  ticketTierName: { type: String },
  // Add-ons purchased
  addOns: [{
    addOnId: { type: String },
    name: { type: String },
    quantity: { type: Number, default: 1 },
    price: { type: Number },
  }],
  // Custom question responses
  responses: [{
    questionId: { type: String },
    question: { type: String },
    answer: { type: String },
  }],
  // Plus-one info
  plusOnes: [{
    name: { type: String },
    email: { type: String },
  }],
  // Check-in status
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  // Group registration
  groupName: { type: String },
  isGroupLeader: { type: Boolean, default: false },
});

// ==================== JOIN REQUEST ====================
const joinRequestSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  avatar: { type: String },
  requestedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  paymentId: { type: String },
  amountPaid: { type: Number, default: 0 },
  ticketTierId: { type: String },
  ticketTierName: { type: String },
  ticketCount: { type: Number, default: 1 },
  responses: [{
    questionId: { type: String },
    question: { type: String },
    answer: { type: String },
  }],
});

// ==================== GUEST LIST (for invite-only) ====================
const guestListSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  invitedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['invited', 'registered', 'declined'],
    default: 'invited'
  },
  plusOnesAllowed: { type: Number, default: 0 },
});

// ==================== MAIN EVENT SCHEMA ====================
const eventSchema = new mongoose.Schema({
  // Basic info
  name: { type: String, required: true },
  description: { type: String },
  date: { type: String, required: true },
  endDate: { type: String }, // for multi-day events
  location: { type: String, required: true },
  venueDetails: { type: String }, // additional venue info
  
  // Media
  flyerUrl: { type: String },
  backgroundUrl: { type: String },
  gallery: [{
    id: { type: String },
    url: { type: String },
  }],
  
  // Links
  links: [{
    id: { type: String },
    url: { type: String },
  }],
  quickLinks: [{
    id: { type: String },
    label: { type: String },
    url: { type: String },
    enabled: { type: Boolean, default: false },
  }],
  
  // ==================== TICKET TIERS ====================
  ticketTiers: [ticketTierSchema],
  hasMultipleTiers: { type: Boolean, default: false },
  
  // Legacy single-tier pricing (for backwards compatibility)
  capacity: { type: Number, default: 50 },
  costPerPerson: { type: Number, default: 0 },
  
  // ==================== ADD-ONS ====================
  addOns: [addOnSchema],
  
  // ==================== CUSTOM QUESTIONS ====================
  customQuestions: [customQuestionSchema],
  
  // Categorization
  category: { 
    type: String, 
    enum: ['party', 'music', 'food', 'sports', 'art', 'tech', 'social', 'wedding', 'corporate', 'sports-tournament', 'workshop', 'other'],
    default: 'other'
  },
  tags: [{ type: String }],
  
  // ==================== PRIVACY SETTINGS ====================
  privacyType: { 
    type: String, 
    enum: ['public', 'private', 'invite-only', 'password'],
    default: 'public'
  },
  isPrivate: { type: Boolean, default: false }, // legacy, kept for compatibility
  inviteCode: { type: String }, // for invite-only events
  eventPassword: { type: String }, // for password-protected events
  guestList: [guestListSchema], // for invite-only events
  
  // ==================== PLUS-ONE SETTINGS ====================
  allowPlusOnes: { type: Boolean, default: false },
  maxPlusOnes: { type: Number, default: 1 },
  plusOneCost: { type: Number, default: 0 }, // additional cost per plus-one
  
  // ==================== GROUP REGISTRATION ====================
  allowGroupRegistration: { type: Boolean, default: false },
  minGroupSize: { type: Number, default: 2 },
  maxGroupSize: { type: Number, default: 10 },
  groupDiscount: { type: Number, default: 0 }, // percentage discount
  
  // Host info
  hostId: { type: String, required: true },
  hostName: { type: String, required: true },
  hostAvatar: { type: String },
  hostEmail: { type: String },
  
  // Attendees
  attendees: [attendeeSchema],
  joinRequests: [joinRequestSchema],
  
  // Waitlist
  waitlist: [{
    id: { type: String },
    name: { type: String },
    email: { type: String },
    ticketTierId: { type: String },
    joinedAt: { type: Date, default: Date.now },
  }],
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  
  // Financial
  totalCollected: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  hostEarnings: { type: Number, default: 0 },
  payoutStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'paid'],
    default: 'pending'
  },
  payoutCompletedAt: { type: Date },
  
  // Timestamps
  publishedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Indexes
eventSchema.index({ name: 'text', description: 'text', tags: 'text' });
eventSchema.index({ hostId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ privacyType: 1 });
eventSchema.index({ inviteCode: 1 });

// Virtual for total capacity across all tiers
eventSchema.virtual('totalCapacity').get(function() {
  if (this.hasMultipleTiers && this.ticketTiers.length > 0) {
    return this.ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
  }
  return this.capacity;
});

// Virtual for total sold across all tiers
eventSchema.virtual('totalSold').get(function() {
  if (this.hasMultipleTiers && this.ticketTiers.length > 0) {
    return this.ticketTiers.reduce((sum, tier) => sum + tier.sold, 0);
  }
  return this.attendees.reduce((sum, a) => sum + (a.ticketCount || 1), 0);
});

// Virtual for spots remaining
eventSchema.virtual('spotsRemaining').get(function() {
  return this.totalCapacity - this.totalSold;
});

export const Event = mongoose.model('Event', eventSchema);
