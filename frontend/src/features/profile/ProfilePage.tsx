import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useUser, useIsLoggedIn, useAuthActions, PLATFORM_FEE_PERCENT } from '../../state/authState';
import type { PaymentMethod, BankDetails } from '../../state/authState';
import { HeaderUserMenu } from '../../components/HeaderUserMenu';
import { readFileAsDataUrl } from '../../utils/file';
import { eventApi } from '../../api/eventApi';
import { authApi, tokenManager } from '../../api/authApi';
import type { LiveEvent } from '../../types/event';

const AVATAR_OPTIONS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=15',
  'https://i.pravatar.cc/150?img=20',
  'https://i.pravatar.cc/150?img=25',
  'https://i.pravatar.cc/150?img=33',
  'https://i.pravatar.cc/150?img=45',
  'https://i.pravatar.cc/150?img=52',
  'https://i.pravatar.cc/150?img=57',
  'https://i.pravatar.cc/150?img=68',
];

export function ProfilePage() {
  const user = useUser();
  const isLoggedIn = useIsLoggedIn();
  const { updateProfile, logout } = useAuthActions();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    avatar: user?.avatar || '',
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Events data
  const [hostedEvents, setHostedEvents] = useState<LiveEvent[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<LiveEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchUserEvents = useCallback(async () => {
    if (!user) return;
    setIsLoadingEvents(true);
    
    const [hostedResult, attendingResult] = await Promise.all([
      eventApi.getHostedEvents(user.id),
      eventApi.getAttendingEvents(user.id),
    ]);
    
    if (hostedResult.ok) setHostedEvents(hostedResult.data);
    if (attendingResult.ok) setAttendingEvents(attendingResult.data);
    
    setIsLoadingEvents(false);
  }, [user]);

  useEffect(() => {
    fetchUserEvents();
  }, [fetchUserEvents]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditForm({ ...editForm, avatar: dataUrl });
      setShowAvatarPicker(false);
    } catch (err) {
      alert('Failed to upload image');
    }
    setIsUploadingAvatar(false);

    // Reset input
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  }

  const pageStyle = useMemo<React.CSSProperties>(
    () => ({
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
    }),
    []
  );

  // Redirect to home if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/search" replace />;
  }

  function handleStartEdit() {
    setEditForm({
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      avatar: user?.avatar || '',
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!editForm.name.trim()) {
      alert('Name is required');
      return;
    }

    setIsSaving(true);

    const profileData = {
      name: editForm.name.trim(),
      bio: editForm.bio.trim() || undefined,
      location: editForm.location.trim() || undefined,
      website: editForm.website.trim() || undefined,
      avatar: editForm.avatar || undefined,
    };

    // Try to save to backend if we have a token
    if (tokenManager.getToken()) {
      const result = await authApi.updateProfile(profileData);
      if (!result.success) {
        console.error('Failed to save profile to backend:', result.error);
        // Continue to save locally even if backend fails
      }
    }

    // Update profile locally
    updateProfile(profileData);

    // Also update host info across all hosted events (local mock data)
    if (user) {
      await eventApi.updateHostProfile(user.id, {
        name: editForm.name.trim(),
        avatar: editForm.avatar || undefined,
      });
      // Refresh events to show updated host info
      fetchUserEvents();
    }

    setIsSaving(false);
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setShowAvatarPicker(false);
  }

  const joinedDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

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
              <a
                href="#"
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                People
              </a>
              <Link
                to="/create"
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Create Event
              </Link>
            </nav>
          </div>

          <HeaderUserMenu />
        </header>

        {/* Main Content */}
        <main className="px-8 py-8 max-w-4xl mx-auto">
          {/* Profile Header Card */}
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
            {/* Cover gradient */}
            <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500" />

            {/* Profile info */}
            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="relative -mt-16 mb-4">
                <div className="relative inline-block">
                  {(isEditing ? editForm.avatar : user?.avatar) ? (
                    <img
                      src={isEditing ? editForm.avatar : user?.avatar}
                      alt={user?.name}
                      className="w-32 h-32 rounded-full border-4 border-zinc-900 bg-zinc-800"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-zinc-900 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                      {(isEditing ? editForm.name : user?.name)?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-purple-500 border-4 border-zinc-900 flex items-center justify-center text-white hover:bg-purple-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Avatar picker */}
                {showAvatarPicker && (
                  <div className="absolute top-full left-0 mt-2 p-4 bg-zinc-800 rounded-2xl border border-white/10 shadow-2xl z-10 w-80">
                    {/* Upload custom photo */}
                    <div className="mb-4">
                      <p className="text-white/70 text-sm mb-2">Upload your photo</p>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="w-full py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Choose from device
                          </>
                        )}
                      </button>
                      <p className="text-white/40 text-xs mt-1 text-center">Max 5MB, JPG/PNG/GIF</p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-white/40 text-xs">or pick an avatar</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Preset avatars */}
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_OPTIONS.map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => {
                            setEditForm({ ...editForm, avatar });
                            setShowAvatarPicker(false);
                          }}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                            editForm.avatar === avatar
                              ? 'border-purple-500 scale-110'
                              : 'border-transparent hover:border-white/30'
                          }`}
                        >
                          <img src={avatar} alt="Avatar option" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    {/* Remove avatar */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({ ...editForm, avatar: '' });
                        setShowAvatarPicker(false);
                      }}
                      className="mt-3 text-sm text-white/50 hover:text-white transition-colors w-full text-center"
                    >
                      Remove avatar
                    </button>
                  </div>
                )}
              </div>

              {/* Name and actions */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Your name"
                      className="text-2xl font-bold text-white bg-transparent border-b-2 border-purple-500 focus:outline-none w-full max-w-xs"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                  )}
                  <p className="text-white/50 mt-1">{user?.email}</p>
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Write a short bio about yourself..."
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                ) : user?.bio ? (
                  <p className="text-white/70">{user.bio}</p>
                ) : (
                  <p className="text-white/40 italic">No bio yet</p>
                )}
              </div>

              {/* Location & Website */}
              <div className="flex flex-wrap gap-6 mb-6">
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">📍</span>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        placeholder="Your location"
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">🔗</span>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        placeholder="Your website"
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {user?.location && (
                      <div className="flex items-center gap-2 text-white/60">
                        <span>📍</span>
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user?.website && (
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <span>🔗</span>
                        <span>{user.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-white/60">
                      <span>📅</span>
                      <span>Joined {joinedDate}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{hostedEvents.length}</p>
                  <p className="text-white/50 text-sm">Events Hosted</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{attendingEvents.length}</p>
                  <p className="text-white/50 text-sm">Events Attended</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-white/50 text-sm">Following</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-white/50 text-sm">Followers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Link
              to="/create"
              className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Create Event</h3>
                  <p className="text-white/50 text-sm">Host your own event</p>
                </div>
              </div>
            </Link>

            <Link
              to="/search"
              className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Discover Events</h3>
                  <p className="text-white/50 text-sm">Find events near you</p>
                </div>
              </div>
            </Link>
          </div>

          {/* My Events Section */}
          <MyEventsSection 
            hostedEvents={hostedEvents} 
            attendingEvents={attendingEvents}
            isLoading={isLoadingEvents}
            onRefresh={fetchUserEvents}
          />

          {/* Payment Details Section */}
          <PaymentDetailsSection />

          {/* Danger Zone */}
          <div className="mt-8 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6">
            <h3 className="text-red-400 font-semibold mb-4">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Sign out of your account</p>
                <p className="text-white/50 text-sm">You can sign back in anytime</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
              >
                Sign out
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function formatCurrency(cents: number): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  party: { label: 'Party', emoji: '🎉' },
  music: { label: 'Music', emoji: '🎵' },
  food: { label: 'Food', emoji: '🍕' },
  sports: { label: 'Sports', emoji: '⚽' },
  art: { label: 'Art', emoji: '🎨' },
  tech: { label: 'Tech', emoji: '💻' },
  social: { label: 'Social', emoji: '👥' },
  other: { label: 'Other', emoji: '🌟' },
};

function MyEventsSection({ 
  hostedEvents, 
  attendingEvents,
  isLoading,
  onRefresh,
}: { 
  hostedEvents: LiveEvent[]; 
  attendingEvents: LiveEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'hosted' | 'attending'>('hosted');
  const navigate = useNavigate();

  const events = activeTab === 'hosted' ? hostedEvents : attendingEvents;

  return (
    <div className="mt-6 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b border-white/10">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('hosted')}
            className={`px-6 py-4 font-medium transition-colors relative ${
              activeTab === 'hosted' 
                ? 'text-white' 
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Hosted Events ({hostedEvents.length})
            {activeTab === 'hosted' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attending')}
            className={`px-6 py-4 font-medium transition-colors relative ${
              activeTab === 'attending' 
                ? 'text-white' 
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Attending ({attendingEvents.length})
            {activeTab === 'attending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="mr-4 p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4 p-3 rounded-xl bg-white/5">
                <div className="w-16 h-16 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">
              {activeTab === 'hosted' ? '🎪' : '🎫'}
            </div>
            <p className="text-white font-medium mb-1">
              {activeTab === 'hosted' ? 'No events hosted yet' : 'Not attending any events'}
            </p>
            <p className="text-white/50 text-sm mb-4">
              {activeTab === 'hosted' 
                ? 'Create your first event and start hosting!' 
                : 'Browse events and join ones you\'re interested in'}
            </p>
            <Link
              to={activeTab === 'hosted' ? '/create' : '/search'}
              className="inline-flex px-4 py-2 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
            >
              {activeTab === 'hosted' ? 'Create Event' : 'Browse Events'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => navigate(`/event/${event.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/event/${event.id}`)}
                role="button"
                tabIndex={0}
              >
                {/* Event image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  {event.flyerUrl ? (
                    <img src={event.flyerUrl} alt={event.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                      {CATEGORIES[event.category]?.emoji}
                    </div>
                  )}
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                      {event.name}
                    </h4>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      event.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' :
                      event.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm flex items-center gap-2 mt-1">
                    <span>📅 {formatEventDate(event.dateTime)}</span>
                    <span>•</span>
                    <span>👥 {event.attendeeCount}{event.capacity ? `/${event.capacity}` : ''}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.costPerPerson === 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {formatCurrency(event.costPerPerson)}
                    </span>
                    {activeTab === 'hosted' && event.hostEarnings > 0 && (
                      <span className="text-xs text-green-400">
                        💰 {formatCurrency(event.hostEarnings)} earned
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit button for hosted events */}
                {activeTab === 'hosted' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/event/${event.id}/edit`);
                    }}
                    className="shrink-0 self-center p-2 rounded-lg bg-white/5 text-white/60 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                    title="Edit Event"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentDetailsSection() {
  const user = useUser();
  const { updateProfile } = useAuthActions();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(user?.paymentMethod || 'none');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: user?.bankDetails?.accountHolderName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || '',
  });

  function handleStartEdit() {
    setPaymentMethod(user?.paymentMethod || 'none');
    setUpiId(user?.upiId || '');
    setBankDetails({
      accountHolderName: user?.bankDetails?.accountHolderName || '',
      accountNumber: user?.bankDetails?.accountNumber || '',
      ifscCode: user?.bankDetails?.ifscCode || '',
      bankName: user?.bankDetails?.bankName || '',
    });
    setIsEditing(true);
  }

  async function handleSave() {
    setIsSaving(true);

    const paymentData = {
      paymentMethod,
      upiId: paymentMethod === 'upi' ? upiId.trim() : undefined,
      bankDetails: paymentMethod === 'bank' ? bankDetails : undefined,
    };

    // Try to save to backend if we have a token
    if (tokenManager.getToken()) {
      const result = await authApi.updateProfile(paymentData);
      if (!result.success) {
        console.error('Failed to save payment details to backend:', result.error);
      }
    }

    // Update locally
    updateProfile(paymentData);

    setIsSaving(false);
    setIsEditing(false);
  }

  const hasPaymentSetup = user?.paymentMethod && user.paymentMethod !== 'none';

  return (
    <div className="mt-6 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Payment Details</h3>
            <p className="text-white/50 text-sm">Receive payments when hosting events</p>
          </div>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all"
          >
            {hasPaymentSetup ? 'Edit' : 'Add Payment Method'}
          </button>
        )}
      </div>

      {/* Platform fee notice */}
      <div className="mb-4 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <p className="text-purple-300 text-sm flex items-start gap-2">
          <span className="shrink-0">💡</span>
          <span>
            A {PLATFORM_FEE_PERCENT}% platform fee is deducted from each payment. The remaining {100 - PLATFORM_FEE_PERCENT}% is transferred to your account.
          </span>
        </p>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Payment method selector */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-xl border transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-purple-500/20 border-purple-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                <div className="text-2xl mb-1">📱</div>
                <div className="font-medium text-sm">UPI</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`p-4 rounded-xl border transition-all ${
                  paymentMethod === 'bank'
                    ? 'bg-purple-500/20 border-purple-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                <div className="text-2xl mb-1">🏦</div>
                <div className="font-medium text-sm">Bank</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('none')}
                className={`p-4 rounded-xl border transition-all ${
                  paymentMethod === 'none'
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                <div className="text-2xl mb-1">❌</div>
                <div className="font-medium text-sm">None</div>
              </button>
            </div>
          </div>

          {/* UPI Details */}
          {paymentMethod === 'upi' && (
            <div>
              <label className="block text-white/70 text-sm mb-2">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <p className="text-white/40 text-xs mt-1">Enter your UPI ID to receive payments (e.g., yourname@paytm, 9876543210@ybl)</p>
            </div>
          )}

          {/* Bank Details */}
          {paymentMethod === 'bank' && (
            <div className="space-y-3">
              <div>
                <label className="block text-white/70 text-sm mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  placeholder="As per bank records"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="SBIN0001234"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="State Bank of India"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/20 text-white font-medium hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (paymentMethod === 'upi' && !upiId.trim()) || (paymentMethod === 'bank' && (!bankDetails.accountNumber || !bankDetails.ifscCode))}
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Payment Details'}
            </button>
          </div>
        </div>
      ) : hasPaymentSetup ? (
        <div className="bg-white/5 rounded-xl p-4">
          {user?.paymentMethod === 'upi' && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-lg">📱</span>
              </div>
              <div>
                <p className="text-white font-medium">UPI</p>
                <p className="text-white/60 text-sm">{user.upiId}</p>
              </div>
              <div className="ml-auto">
                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">Active</span>
              </div>
            </div>
          )}
          {user?.paymentMethod === 'bank' && user.bankDetails && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-lg">🏦</span>
              </div>
              <div>
                <p className="text-white font-medium">{user.bankDetails.bankName}</p>
                <p className="text-white/60 text-sm">
                  A/C: ****{user.bankDetails.accountNumber.slice(-4)} • {user.bankDetails.ifscCode}
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">Active</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">💳</div>
          <p className="text-white/60 text-sm">No payment method configured</p>
          <p className="text-white/40 text-xs mt-1">Add a payment method to receive money from your events</p>
        </div>
      )}
    </div>
  );
}

