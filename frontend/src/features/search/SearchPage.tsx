import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import type { SearchFilters } from '../../api/eventApi';
import type { LiveEvent } from '../../types/event';
import { HeaderUserMenu } from '../../components/HeaderUserMenu';
import { formatPrice } from '../../utils/currency';

const CATEGORIES = [
  { value: 'all', label: 'All Events', emoji: '✨' },
  { value: 'party', label: 'Party', emoji: '🎉' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'food', label: 'Food', emoji: '🍕' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'other', label: 'Other', emoji: '🌟' },
] as const;

function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Tomorrow at ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeStr}`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
}

// Using formatPrice from currency utils

function EventCard({ event }: { event: LiveEvent }) {
  const capacityPercent = event.capacity
    ? Math.round((event.attendeeCount / event.capacity) * 100)
    : null;

  return (
    <Link
      to={`/event/${event.id}`}
      className="group relative bg-zinc-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {event.flyerUrl ? (
          <img
            src={event.flyerUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex gap-1.5">
            {/* Category badge */}
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/20">
              {CATEGORIES.find((c) => c.value === event.category)?.emoji}{' '}
              {CATEGORIES.find((c) => c.value === event.category)?.label}
            </span>
            {/* Privacy badge */}
            {event.isPrivate && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/30 backdrop-blur-md text-amber-300 text-xs font-medium border border-amber-500/30">
                🔒
              </span>
            )}
          </div>
          {/* Price badge */}
          <span
            className={`px-2.5 py-1 rounded-full backdrop-blur-md text-xs font-bold border ${
              event.costPerPerson === 0
                ? 'bg-green-500/30 text-green-300 border-green-500/30'
                : 'bg-purple-500/30 text-purple-300 border-purple-500/30'
            }`}
          >
            {formatPrice(event.costPerPerson)}
          </span>
        </div>

        {/* Attendee count */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/20">
            👥 {event.attendeeCount}{event.capacity && ` / ${event.capacity}`}
          </span>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Date */}
        <p className="text-emerald-400 text-sm font-medium mb-2">
          {formatEventDate(event.dateTime)}
        </p>

        {/* Title */}
        <h3 className="text-white text-lg font-bold mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
          {event.name}
        </h3>

        {/* Location */}
        <p className="text-white/60 text-sm mb-4 flex items-center gap-1.5">
          <span className="text-base">📍</span>
          <span className="truncate">{event.location}</span>
        </p>

        {/* Host */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {event.hostAvatar ? (
              <img
                src={event.hostAvatar}
                alt={event.hostName}
                className="w-7 h-7 rounded-full border border-white/20"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {event.hostName.charAt(0)}
              </div>
            )}
            <span className="text-white/70 text-sm">by {event.hostName}</span>
          </div>

          {/* Capacity bar */}
          {capacityPercent !== null && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    capacityPercent >= 90
                      ? 'bg-red-500'
                      : capacityPercent >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                />
              </div>
              <span className="text-white/40 text-xs">{capacityPercent}%</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-white/5 text-white/50 text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent" />
      </div>
    </Link>
  );
}

export function SearchPage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchFilters['category']>('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      const result = await eventApi.getLiveEvents({
        query: debouncedQuery,
        category: selectedCategory,
      });
      if (result.ok) {
        setEvents(result.data);
      }
      setIsLoading(false);
    }
    fetchEvents();
  }, [debouncedQuery, selectedCategory]);

  const pageStyle = useMemo<React.CSSProperties>(() => ({
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    minHeight: '100vh',
  }), []);

  return (
    <div style={pageStyle}>
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-white italic tracking-tight hover:text-purple-300 transition-colors">
              let's hang
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link to="/search" className="text-white text-sm font-medium transition-colors border-b-2 border-purple-500 pb-0.5">
                Discover
              </Link>
              <a href="#" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                People
              </a>
              <Link to="/create" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                Create Event
              </Link>
            </nav>
          </div>

          <HeaderUserMenu />
        </header>

        {/* Hero / Search Section */}
        <div className="px-8 pt-8 pb-6 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Discover Live Events
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-xl">
            Find amazing events happening near you. Connect, celebrate, and create memories.
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, hosts, locations..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.value
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10'
                }`}
              >
                {category.emoji} {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <main className="px-8 pb-16 max-w-7xl mx-auto">
          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-white/50 text-sm">
              {isLoading ? 'Searching...' : `${events.length} event${events.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/80 rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-white/10 rounded w-24" />
                    <div className="h-5 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-32" />
                    <div className="h-8 bg-white/5 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-white text-xl font-bold mb-2">No events found</h3>
              <p className="text-white/50">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

