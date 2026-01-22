import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import type { LiveEvent, EventCategory } from '../../types/event';
import { HeaderUserMenu } from '../../components/HeaderUserMenu';
import { useUser, useIsLoggedIn } from '../../state/authState';

const CATEGORIES = [
  { value: 'party', label: 'Party', emoji: '🎉' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'food', label: 'Food', emoji: '🍕' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'other', label: 'Other', emoji: '🌟' },
] as const;

export function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUser();
  const isLoggedIn = useIsLoggedIn();

  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    dateTime: '',
    location: '',
    capacity: '',
    costPerPerson: '',
    category: 'social' as EventCategory,
    tags: [] as string[],
    isPrivate: false,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      setIsLoading(true);
      const result = await eventApi.getEventById(id);
      if (result.ok) {
        const e = result.data;
        setEvent(e);
        setForm({
          name: e.name,
          description: e.description || '',
          dateTime: e.dateTime.slice(0, 16), // Format for datetime-local input
          location: e.location,
          capacity: e.capacity?.toString() || '',
          costPerPerson: (e.costPerPerson / 100).toFixed(2),
          category: e.category,
          tags: [...e.tags],
          isPrivate: e.isPrivate,
        });
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }
    fetchEvent();
  }, [id]);

  const pageStyle = useMemo<React.CSSProperties>(
    () => ({
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
    }),
    []
  );

  // Redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/search" replace />;
  }

  // Check if user is the host
  if (event && user && event.hostId !== user.id) {
    return <Navigate to={`/event/${id}`} replace />;
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
        setForm({ ...form, tags: [...form.tags, tag] });
        setTagInput('');
      }
    }
  }

  function handleRemoveTag(tag: string) {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  }

  async function handleSave() {
    if (!id || !user || !event) return;

    if (!form.name.trim()) {
      setError('Event name is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    // Parse cost to cents
    let costInCents = 0;
    const parsed = parseFloat(form.costPerPerson);
    if (!isNaN(parsed)) {
      costInCents = Math.round(parsed * 100);
    }

    const result = await eventApi.updateEvent(id, user.id, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      dateTime: form.dateTime || undefined,
      location: form.location.trim() || undefined,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      costPerPerson: costInCents,
      category: form.category,
      tags: form.tags,
      isPrivate: form.isPrivate,
    });

    if (result.ok) {
      setSaveMessage('Event updated successfully!');
      setEvent(result.data);
      setTimeout(() => {
        navigate(`/event/${id}`);
      }, 1000);
    } else {
      setError(result.error);
    }

    setIsSaving(false);
  }

  return (
    <div style={pageStyle}>
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            <Link
              to="/search"
              className="text-2xl font-bold text-white italic tracking-tight hover:text-purple-300 transition-colors"
            >
              let's hang
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                to="/search"
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Discover
              </Link>
              <Link
                to="/profile"
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Profile
              </Link>
            </nav>
          </div>

          <HeaderUserMenu />
        </header>

        {/* Main Content */}
        <main className="px-8 py-8 max-w-3xl mx-auto">
          {/* Back button */}
          <Link
            to={event ? `/event/${event.id}` : '/profile'}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to event
          </Link>

          {isLoading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-white/10 rounded w-1/3" />
              <div className="h-12 bg-white/10 rounded" />
              <div className="h-32 bg-white/10 rounded" />
              <div className="h-12 bg-white/10 rounded" />
            </div>
          ) : error && !event ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-white text-2xl font-bold mb-2">Error</h2>
              <p className="text-white/50 mb-6">{error}</p>
              <Link
                to="/profile"
                className="inline-flex px-6 py-3 rounded-full bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
              >
                Back to Profile
              </Link>
            </div>
          ) : event ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Edit Event</h1>
                {event.status !== 'upcoming' && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    event.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {event.status}
                  </span>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  {error}
                </div>
              )}
              {saveMessage && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
                  {saveMessage}
                </div>
              )}

              {/* Form */}
              <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
                {/* Event Name */}
                <div>
                  <label className="block text-white font-medium mb-2">Event Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Give your event a catchy name"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white font-medium mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What's your event about?"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.dateTime}
                      onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Where's it happening?"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* Capacity & Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Capacity</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      placeholder="Max attendees (optional)"
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Price per Person ($)</label>
                    <input
                      type="number"
                      value={form.costPerPerson}
                      onChange={(e) => setForm({ ...form, costPerPerson: e.target.value })}
                      placeholder="0 for free"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white font-medium mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.value })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          form.category === cat.value
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                        }`}
                      >
                        <div className="text-xl mb-1">{cat.emoji}</div>
                        <div className="text-xs">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-white font-medium mb-2">Tags (max 5)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {form.tags.length < 5 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type a tag and press Enter"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  )}
                </div>

                {/* Privacy */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/20">
                  <div>
                    <p className="text-white font-medium">Private Event</p>
                    <p className="text-white/50 text-sm">Attendees need approval to join</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      form.isPrivate ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        form.isPrivate ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Warning for completed events */}
                {event.status !== 'upcoming' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                    ⚠️ This event is {event.status}. Some changes may not be applicable.
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Link
                    to={`/event/${event.id}`}
                    className="flex-1 py-4 rounded-xl bg-white/5 border border-white/20 text-white font-medium text-center hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || event.status === 'completed' || event.status === 'cancelled'}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

