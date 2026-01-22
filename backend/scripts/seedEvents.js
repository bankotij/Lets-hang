import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letshang';

// Sample event data
const sampleEvents = [
  // User 1's events
  {
    name: 'Summer Rooftop Party 🌅',
    description: 'Join us for an unforgettable evening on the rooftop! Live DJ, craft cocktails, and stunning city views. Dress code: Summer chic. Don\'t miss the sunset!',
    category: 'party',
    tags: ['rooftop', 'summer', 'cocktails', 'dj'],
    location: 'Sky Lounge, 42nd Floor, Manhattan',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'General', emoji: '🎫', color: '#6b7280', price: 2500, quantity: 100, sold: 23, perks: ['Entry access', 'Welcome drink'], sortOrder: 0 },
      { id: 't2', name: 'VIP', emoji: '⭐', color: '#eab308', price: 7500, quantity: 30, sold: 8, perks: ['Priority entry', 'VIP section', 'Open bar'], sortOrder: 1 },
      { id: 't3', name: 'Diamond', emoji: '💎', color: '#3b82f6', price: 15000, quantity: 10, sold: 2, perks: ['Meet the DJ', 'Exclusive lounge', 'Premium bottle service'], sortOrder: 2 },
    ],
    addOns: [
      { id: 'a1', name: 'Parking Pass', emoji: '🚗', price: 1500, sold: 5, description: 'Reserved parking in building garage' },
      { id: 'a2', name: 'Photo Package', emoji: '📸', price: 2000, sold: 12, description: 'Professional photos emailed next day' },
    ],
    privacyType: 'public',
    allowPlusOnes: true,
    maxPlusOnes: 2,
    plusOneCost: 2000,
  },
  {
    name: 'Tech Startup Mixer',
    description: 'Connect with fellow entrepreneurs, investors, and tech enthusiasts. Pitch practice sessions, networking, and free pizza! Perfect for founders and aspiring entrepreneurs.',
    category: 'tech',
    tags: ['startup', 'networking', 'entrepreneurs', 'tech'],
    location: 'WeWork Innovation Hub, San Francisco',
    hasMultipleTiers: false,
    costPerPerson: 0, // Free event
    capacity: 75,
    privacyType: 'public',
    customQuestions: [
      { id: 'q1', question: 'What\'s your startup/project?', type: 'text', required: true },
      { id: 'q2', question: 'Are you looking for...', type: 'select', options: ['Co-founder', 'Investment', 'Networking', 'Just curious'], required: false },
    ],
  },
  {
    name: 'Wine & Paint Night 🎨🍷',
    description: 'Unleash your inner artist! No experience needed. We provide all materials, wine, and step-by-step guidance. Take home your masterpiece!',
    category: 'art',
    tags: ['wine', 'painting', 'creative', 'relaxing'],
    location: 'The Art Studio, Brooklyn',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'Standard', emoji: '🎨', color: '#ec4899', price: 4500, quantity: 24, sold: 18, perks: ['Art supplies', 'Canvas', '2 glasses of wine'], sortOrder: 0 },
      { id: 't2', name: 'Premium', emoji: '🍾', color: '#8b5cf6', price: 7500, quantity: 12, sold: 6, perks: ['Premium supplies', 'Larger canvas', 'Unlimited wine', 'Take-home frame'], sortOrder: 1 },
    ],
    privacyType: 'public',
    allowGroupRegistration: true,
    minGroupSize: 4,
    maxGroupSize: 8,
    groupDiscount: 15,
  },
  {
    name: 'Exclusive Album Listening Party 🎵',
    description: 'Be the first to hear the new album before it drops! Limited spots. NDA required. Snacks and drinks provided.',
    category: 'music',
    tags: ['music', 'exclusive', 'album', 'vip'],
    location: 'Private Recording Studio, Nashville',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'Listener', emoji: '🎧', color: '#f97316', price: 5000, quantity: 50, sold: 42, perks: ['Album access', 'Signed poster'], sortOrder: 0 },
      { id: 't2', name: 'Superfan', emoji: '🔥', color: '#ef4444', price: 15000, quantity: 15, sold: 11, perks: ['Meet & greet', 'Photo op', 'Exclusive merch'], sortOrder: 1 },
    ],
    privacyType: 'invite-only',
    inviteCode: 'ALBUM24',
  },
  {
    name: 'Beach Volleyball Tournament 🏐',
    description: '4v4 beach volleyball tournament! All skill levels welcome. Prizes for top 3 teams. BBQ lunch included for all participants.',
    category: 'sports',
    tags: ['volleyball', 'beach', 'tournament', 'outdoor'],
    location: 'Santa Monica Beach, Court 5-8',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'Player', emoji: '🏐', color: '#0ea5e9', price: 3500, quantity: 64, sold: 48, perks: ['Tournament entry', 'Team shirt', 'BBQ lunch'], sortOrder: 0 },
      { id: 't2', name: 'Spectator', emoji: '👀', color: '#84cc16', price: 1000, quantity: 100, sold: 35, perks: ['Viewing access', 'BBQ lunch'], sortOrder: 1 },
    ],
    privacyType: 'public',
    allowGroupRegistration: true,
    minGroupSize: 4,
    maxGroupSize: 4,
    groupDiscount: 10,
    addOns: [
      { id: 'a1', name: 'Extra Shirt', emoji: '👕', price: 1500, sold: 8, description: 'Additional tournament shirt' },
      { id: 'a2', name: 'Parking', emoji: '🚗', price: 1000, sold: 22, description: 'Reserved beach parking' },
    ],
  },
  
  // User 2's events
  {
    name: 'Gourmet Food Crawl 🍜',
    description: 'Explore 5 amazing restaurants in one night! From street tacos to fine dining. All tastings included. Bring your appetite!',
    category: 'food',
    tags: ['food', 'tour', 'dining', 'adventure'],
    location: 'Starting Point: Union Square, NYC',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'Foodie', emoji: '🍜', color: '#f59e0b', price: 8500, quantity: 20, sold: 14, perks: ['5 restaurant tastings', 'Guide', 'Water bottle'], sortOrder: 0 },
      { id: 't2', name: 'Gourmet', emoji: '🥂', color: '#a855f7', price: 15000, quantity: 8, sold: 5, perks: ['All tastings', 'Wine pairings', 'Private guide', 'Recipe book'], sortOrder: 1 },
    ],
    privacyType: 'public',
    allowPlusOnes: true,
    maxPlusOnes: 1,
    plusOneCost: 8500,
    customQuestions: [
      { id: 'q1', question: 'Any dietary restrictions?', type: 'select', options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Other'], required: true },
      { id: 'q2', question: 'Any allergies we should know about?', type: 'text', required: false },
    ],
  },
  {
    name: 'Meditation & Yoga Retreat 🧘',
    description: 'A full day of mindfulness, yoga sessions, healthy meals, and nature walks. Disconnect to reconnect. All levels welcome.',
    category: 'social',
    tags: ['yoga', 'meditation', 'wellness', 'retreat'],
    location: 'Serenity Gardens, Upstate New York',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'Day Pass', emoji: '🧘', color: '#14b8a6', price: 12000, quantity: 30, sold: 22, perks: ['All sessions', 'Lunch', 'Tea ceremony'], sortOrder: 0 },
      { id: 't2', name: 'Full Experience', emoji: '✨', color: '#8b5cf6', price: 25000, quantity: 10, sold: 7, perks: ['All sessions', 'Meals', 'Private coaching', 'Take-home kit'], sortOrder: 1 },
    ],
    privacyType: 'private',
    addOns: [
      { id: 'a1', name: 'Yoga Mat', emoji: '🧘', price: 3500, sold: 8, description: 'Premium eco-friendly yoga mat' },
      { id: 'a2', name: 'Massage Session', emoji: '💆', price: 8000, quantity: 10, sold: 6, description: '30-min relaxation massage' },
    ],
  },
  {
    name: 'Indie Film Premiere Night 🎬',
    description: 'Be among the first to watch three award-winning indie shorts. Q&A with directors. Popcorn and drinks included!',
    category: 'art',
    tags: ['film', 'indie', 'premiere', 'cinema'],
    location: 'The Arthouse Cinema, Austin',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'General', emoji: '🎬', color: '#64748b', price: 2000, quantity: 80, sold: 55, perks: ['Screening access', 'Popcorn', 'Drink'], sortOrder: 0 },
      { id: 't2', name: 'Film Buff', emoji: '🎥', color: '#eab308', price: 5000, quantity: 20, sold: 12, perks: ['Premium seating', 'Director meet', 'Poster'], sortOrder: 1 },
    ],
    privacyType: 'public',
  },
  {
    name: 'Password Protected Game Night 🎮',
    description: 'Board games, video games, and card games! Snacks provided. Bring your competitive spirit. Password shared with registered attendees.',
    category: 'social',
    tags: ['games', 'boardgames', 'fun', 'social'],
    location: 'The Game Vault, Portland',
    hasMultipleTiers: false,
    costPerPerson: 1500,
    capacity: 40,
    privacyType: 'password',
    eventPassword: 'GAME2024',
    addOns: [
      { id: 'a1', name: 'Snack Box', emoji: '🍿', price: 800, sold: 15, description: 'Premium snack selection' },
      { id: 'a2', name: 'Game Rental', emoji: '🎲', price: 500, sold: 8, description: 'Take home a game for the week' },
    ],
  },
  {
    name: 'Charity 5K Run for Education 🏃',
    description: 'Run or walk for a cause! All proceeds go to local school programs. Medals for all finishers. Post-race breakfast included.',
    category: 'sports',
    tags: ['charity', 'running', '5k', 'community'],
    location: 'Central Park, New York',
    hasMultipleTiers: true,
    ticketTiers: [
      { id: 't1', name: 'Runner', emoji: '🏃', color: '#22c55e', price: 3000, quantity: 500, sold: 342, perks: ['Race entry', 'Bib & timing', 'Medal', 'Breakfast'], sortOrder: 0 },
      { id: 't2', name: 'Champion', emoji: '🏆', color: '#f59e0b', price: 7500, quantity: 50, sold: 28, perks: ['All perks', 'Premium shirt', 'VIP tent', 'Extra donation'], sortOrder: 1 },
    ],
    privacyType: 'public',
    customQuestions: [
      { id: 'q1', question: 'T-shirt size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true },
      { id: 'q2', question: 'Emergency contact name & phone', type: 'text', required: true },
    ],
    allowGroupRegistration: true,
    minGroupSize: 5,
    maxGroupSize: 20,
    groupDiscount: 20,
  },
];

async function seedEvents() {
  try {
    console.log('🌱 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create two users
    let user1 = await User.findOne({ email: 'demo@letshang.com' });
    let user2 = await User.findOne({ email: 'host@letshang.com' });

    if (!user1) {
      user1 = new User({
        name: 'Demo User',
        email: 'demo@letshang.com',
        password: 'demo123',
        isVerified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      });
      await user1.save();
      console.log('✅ Created user: demo@letshang.com (password: demo123)');
    }

    if (!user2) {
      user2 = new User({
        name: 'Event Host',
        email: 'host@letshang.com',
        password: 'host123',
        isVerified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host',
      });
      await user2.save();
      console.log('✅ Created user: host@letshang.com (password: host123)');
    }

    // Clear existing events from these users
    await Event.deleteMany({ hostId: { $in: [user1._id.toString(), user2._id.toString()] } });
    console.log('🗑️  Cleared existing events from seed users');

    // Create events
    const users = [user1, user2];
    const createdEvents = [];

    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      const user = users[i < 5 ? 0 : 1]; // First 5 for user1, rest for user2

      // Generate a date between now and 3 months from now
      const daysFromNow = Math.floor(Math.random() * 90) + 1;
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + daysFromNow);
      eventDate.setHours(Math.floor(Math.random() * 8) + 14); // 2pm to 10pm
      eventDate.setMinutes([0, 30][Math.floor(Math.random() * 2)]);

      const event = new Event({
        ...eventData,
        date: eventDate.toISOString(),
        hostId: user._id.toString(),
        hostName: user.name,
        hostAvatar: user.avatar,
        hostEmail: user.email,
        status: 'upcoming',
        attendees: [],
        joinRequests: [],
        totalCollected: 0,
        platformFee: 0,
        hostEarnings: 0,
      });

      await event.save();
      createdEvents.push(event);
      console.log(`✅ Created: "${event.name}" by ${user.name}`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log(`   Created ${createdEvents.length} events`);
    console.log('\n📧 Test accounts:');
    console.log('   Email: demo@letshang.com | Password: demo123');
    console.log('   Email: host@letshang.com | Password: host123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

seedEvents();
