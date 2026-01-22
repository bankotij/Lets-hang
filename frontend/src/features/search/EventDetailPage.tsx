import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import type { LiveEvent, Attendee } from '../../types/event';
import { CANCELLATION_FEE_PERCENT } from '../../types/event';
import { HeaderUserMenu } from '../../components/HeaderUserMenu';
import { JoinEventModal } from '../../components/JoinEventModal';
import { ShareEventModal } from '../../components/ShareEventModal';
import { useUser, PLATFORM_FEE_PERCENT } from '../../state/authState';
import { formatPrice, formatMoney, formatPriceRange } from '../../utils/currency';

const CATEGORIES = [
  { value: 'party', label: 'Party', emoji: '🎉' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'food', label: 'Food', emoji: '🍕' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'wedding', label: 'Wedding', emoji: '💒' },
  { value: 'corporate', label: 'Corporate', emoji: '🏢' },
  { value: 'sports-tournament', label: 'Tournament', emoji: '🏆' },
  { value: 'workshop', label: 'Workshop', emoji: '🔧' },
  { value: 'other', label: 'Other', emoji: '🌟' },
] as const;

const PRIVACY_LABELS = {
  'public': { label: 'Public', emoji: '🌐', color: 'green' },
  'private': { label: 'Approval Required', emoji: '🔒', color: 'amber' },
  'invite-only': { label: 'Invite Only', emoji: '✉️', color: 'purple' },
  'password': { label: 'Password Protected', emoji: '🔑', color: 'blue' },
} as const;

function formatEventDateTime(dateString: string) {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return { dateStr, timeStr };
}

// Using formatPrice, formatMoney from currency utils

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [userStatus, setUserStatus] = useState<'host' | 'joined' | 'pending' | 'none'>('none');
  const [userAttendee, setUserAttendee] = useState<Attendee | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    const result = await eventApi.getEventById(id);
    if (result.ok) {
      setEvent(result.data);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Check user's status for this event
  useEffect(() => {
    async function checkStatus() {
      if (!id || !user) {
        setUserStatus('none');
        setUserAttendee(null);
        return;
      }
      const result = await eventApi.getUserEventStatus(id, user.id);
      if (result.ok) {
        setUserStatus(result.data.status);
        if (result.data.status === 'joined' && result.data.attendee) {
          setUserAttendee(result.data.attendee);
        } else {
          setUserAttendee(null);
        }
      }
    }
    checkStatus();
  }, [id, user, event]);

  const pageStyle = useMemo<React.CSSProperties>(() => {
    const defaultBg = 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)';
    
    if (event?.backgroundUrl) {
      const isGradient = event.backgroundUrl.startsWith('linear-gradient');
      return {
        backgroundImage: isGradient ? event.backgroundUrl : `url(${event.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      };
    }
    
    return {
      background: defaultBg,
      minHeight: '100vh',
    };
  }, [event?.backgroundUrl]);

  const categoryInfo = event
    ? CATEGORIES.find((c) => c.value === event.category)
    : null;

  const { dateStr, timeStr } = event
    ? formatEventDateTime(event.dateTime)
    : { dateStr: '', timeStr: '' };

  const capacityPercent = event?.capacity
    ? Math.round((event.attendeeCount / event.capacity) * 100)
    : null;

  const spotsLeft = event?.capacity
    ? event.capacity - event.attendeeCount
    : null;

  const isFull = event?.capacity ? event.attendeeCount >= event.capacity : false;

  function handleJoinSuccess() {
    // Refresh event data
    fetchEvent();
  }

  async function handleCancelAttendance() {
    if (!id || !user) return;
    setIsCancelling(true);
    setCancelMessage(null);

    const result = await eventApi.cancelAttendance(id, user.id);
    if (result.ok) {
      setCancelMessage(result.data.message);
      setShowCancelConfirm(false);
      // Refresh after a delay to show the message
      setTimeout(() => {
        fetchEvent();
        setCancelMessage(null);
      }, 2000);
    } else {
      setCancelMessage(`Error: ${result.error}`);
    }
    setIsCancelling(false);
  }

  async function handleCancelRequest() {
    if (!id || !user) return;
    setIsCancelling(true);
    setCancelMessage(null);

    const result = await eventApi.cancelJoinRequest(id, user.id);
    if (result.ok) {
      setCancelMessage(result.data.message);
      setShowCancelConfirm(false);
      setTimeout(() => {
        fetchEvent();
        setCancelMessage(null);
      }, 2000);
    } else {
      setCancelMessage(`Error: ${result.error}`);
    }
    setIsCancelling(false);
  }

  async function handleMarkCompleted() {
    if (!id || !user) return;
    const result = await eventApi.markEventCompleted(id, user.id);
    if (result.ok) {
      fetchEvent();
    }
  }

  async function handleRequestPayout() {
    if (!id || !user) return;
    setIsProcessingPayout(true);
    setPayoutMessage(null);

    const result = await eventApi.requestPayout(id, user.id);
    if (result.ok) {
      setPayoutMessage(result.data.message);
      setTimeout(() => {
        fetchEvent();
        setPayoutMessage(null);
      }, 2000);
    } else {
      setPayoutMessage(`Error: ${result.error}`);
    }
    setIsProcessingPayout(false);
  }

  // Calculate refund amount for display
  const estimatedRefund = useMemo(() => {
    if (!userAttendee || userAttendee.paidAmount === 0) return null;
    const cancellationFee = Math.round(userAttendee.paidAmount * CANCELLATION_FEE_PERCENT / 100);
    const refundAmount = userAttendee.paidAmount - cancellationFee;
    return { cancellationFee, refundAmount };
  }, [userAttendee]);

  function getActionButton() {
    if (!event) return null;

    // Show cancel message if present
    if (cancelMessage) {
      return (
        <div className="w-full py-4 px-6 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 font-medium text-center">
          {cancelMessage}
        </div>
      );
    }

    // Host sees "Manage Event" - handled separately in host panel
    if (userStatus === 'host') {
      return null;
    }

    // Already joined - show with cancel option
    if (userStatus === 'joined') {
      return (
        <div className="space-y-3">
          <div className="w-full py-4 rounded-2xl bg-green-500/20 border border-green-400/30 text-green-400 font-semibold text-lg flex items-center justify-center gap-2">
            <span>✅</span>
            <span>You're attending</span>
          </div>
          
          {!showCancelConfirm ? (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white/70 font-medium hover:bg-red-500/10 hover:border-red-400/30 hover:text-red-400 transition-all flex items-center justify-center gap-2"
            >
              Cancel Attendance
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 space-y-3">
              <p className="text-white font-medium text-sm">Are you sure you want to cancel?</p>
              {estimatedRefund && (
                <div className="text-white/70 text-sm space-y-1">
                  <p>• Cancellation fee ({CANCELLATION_FEE_PERCENT}%): {formatMoney(estimatedRefund.cancellationFee)}</p>
                  <p>• Refund amount: <span className="text-green-400 font-medium">{formatMoney(estimatedRefund.refundAmount)}</span></p>
                </div>
              )}
              {!estimatedRefund && userAttendee?.paidAmount === 0 && (
                <p className="text-white/50 text-sm">This was a free event, no refund needed.</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                  disabled={isCancelling}
                >
                  Keep Spot
                </button>
                <button
                  type="button"
                  onClick={handleCancelAttendance}
                  disabled={isCancelling}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Pending request - show with cancel option
    if (userStatus === 'pending') {
      return (
        <div className="space-y-3">
          <div className="w-full py-4 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 font-semibold text-lg flex items-center justify-center gap-2">
            <span>⏳</span>
            <span>Request pending</span>
          </div>
          
          {!showCancelConfirm ? (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white/70 font-medium hover:bg-red-500/10 hover:border-red-400/30 hover:text-red-400 transition-all flex items-center justify-center gap-2"
            >
              Cancel Request
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 space-y-3">
              <p className="text-white font-medium text-sm">Cancel your join request?</p>
              <p className="text-white/50 text-sm">You'll receive a full refund if you already paid.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                  disabled={isCancelling}
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  disabled={isCancelling}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Event is full
    if (isFull) {
      return (
        <div className="w-full py-4 rounded-2xl bg-red-500/20 border border-red-400/30 text-red-400 font-semibold text-lg flex items-center justify-center gap-2">
          <span>🚫</span>
          <span>Event is full</span>
        </div>
      );
    }

    // Can join
    const buttonText = event.isPrivate ? 'Request to Join' : 'Join Event';
    const priceText = event.costPerPerson > 0 ? ` • ${formatPrice(event.costPerPerson)}` : '';

    return (
      <button
        type="button"
        onClick={() => setShowJoinModal(true)}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
      >
        {buttonText}{priceText}
      </button>
    );
  }

  function getHostPanel() {
    if (!event || userStatus !== 'host') return null;

    const isCompleted = event.status === 'completed';
    const canRequestPayout = isCompleted && event.payoutStatus === 'pending' && event.hostEarnings > 0;
    const payoutProcessing = event.payoutStatus === 'processing';
    const payoutPaid = event.payoutStatus === 'paid';

    return (
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <h3 className="text-white font-bold text-lg">Host Dashboard</h3>
        </div>

        {/* Earnings Display */}
        <div className="bg-black/20 rounded-xl p-4 space-y-3">
          <h4 className="text-white/70 text-sm font-medium">Event Earnings</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Collected</span>
              <span className="text-white font-medium">{formatMoney(event.totalCollected)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
              <span className="text-red-400">-{formatMoney(event.platformFee)}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between">
              <span className="text-white font-medium">Your Earnings</span>
              <span className="text-green-400 font-bold text-lg">{formatMoney(event.hostEarnings)}</span>
            </div>
          </div>
        </div>

        {/* Event Status */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            event.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' :
            event.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
        </div>

        {/* Payout Status */}
        {event.hostEarnings > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Payout:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              payoutPaid ? 'bg-green-500/20 text-green-400' :
              payoutProcessing ? 'bg-blue-500/20 text-blue-400' :
              'bg-white/10 text-white/60'
            }`}>
              {payoutPaid ? '✓ Paid' : payoutProcessing ? 'Processing...' : 'Pending'}
            </span>
          </div>
        )}

        {/* Payout message */}
        {payoutMessage && (
          <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 text-sm">
            {payoutMessage}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* Edit Event Button */}
          {event.status === 'upcoming' && (
            <Link
              to={`/event/${event.id}/edit`}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Event
            </Link>
          )}

          {!isCompleted && (
            <button
              type="button"
              onClick={handleMarkCompleted}
              className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors"
            >
              Mark Event as Completed
            </button>
          )}
          
          {canRequestPayout && (
            <button
              type="button"
              onClick={handleRequestPayout}
              disabled={isProcessingPayout}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
            >
              {isProcessingPayout ? 'Processing...' : `Receive Payout (${formatMoney(event.hostEarnings)})`}
            </button>
          )}

          {!isCompleted && (
            <p className="text-white/40 text-xs text-center">
              Payout can only be requested after the event is completed
            </p>
          )}

          {payoutPaid && event.payoutCompletedAt && (
            <p className="text-green-400/70 text-xs text-center">
              Payout completed on {new Date(event.payoutCompletedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Dark overlay for custom backgrounds */}
      {event?.backgroundUrl && (
        <div className="fixed inset-0 bg-black/60 pointer-events-none" />
      )}
      
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
        />
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
        <main className="px-8 py-8 max-w-6xl mx-auto">
          {/* Back button */}
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to events
          </Link>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
                <div className="aspect-[16/10] bg-white/10 rounded-3xl" />
                <div className="space-y-4">
                  <div className="h-8 bg-white/10 rounded w-32" />
                  <div className="h-10 bg-white/10 rounded w-full" />
                  <div className="h-20 bg-white/10 rounded w-full" />
                  <div className="h-12 bg-white/10 rounded w-full" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-white text-2xl font-bold mb-2">
                Event not found
              </h2>
              <p className="text-white/50 mb-6">{error}</p>
              <Link
                to="/search"
                className="inline-flex px-6 py-3 rounded-full bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
              >
                Browse events
              </Link>
            </div>
          ) : event ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
              {/* Left - Image & Details */}
              <div className="space-y-6">
                {/* Flyer Image */}
                <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-zinc-900/80">
                  {event.flyerUrl ? (
                    <img
                      src={event.flyerUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                      <span className="text-8xl">{categoryInfo?.emoji}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-medium border border-white/20">
                      {categoryInfo?.emoji} {categoryInfo?.label}
                    </span>
                    {(() => {
                      const privacyType = event.privacyType || (event.isPrivate ? 'private' : 'public');
                      const privacyInfo = PRIVACY_LABELS[privacyType] || PRIVACY_LABELS.public;
                      const colorClasses = {
                        green: 'bg-green-500/20 text-green-400 border-green-500/30',
                        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                      };
                      return (
                        <span className={`px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium border ${colorClasses[privacyInfo.color]}`}>
                          {privacyInfo.emoji} {privacyInfo.label}
                        </span>
                      );
                    })()}
                    {event.hasMultipleTiers && (
                      <span className="px-4 py-2 rounded-full bg-purple-500/20 backdrop-blur-md text-purple-400 text-sm font-medium border border-purple-500/30">
                        🎟️ Multiple Tiers
                      </span>
                    )}
                    {event.allowGroupRegistration && (
                      <span className="px-4 py-2 rounded-full bg-cyan-500/20 backdrop-blur-md text-cyan-400 text-sm font-medium border border-cyan-500/30">
                        👥 Group Registration
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-bold text-lg mb-3">About</h3>
                  <p className="text-white/70 leading-relaxed">
                    {event.description || 'No description available.'}
                  </p>
                </div>

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-2 rounded-full bg-white/5 text-white/60 text-sm border border-white/10"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ticket Tiers */}
                {event.hasMultipleTiers && event.ticketTiers && event.ticketTiers.length > 0 && (
                  <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <span>🎟️</span>
                      Ticket Options
                    </h3>
                    <div className="space-y-3">
                      {event.ticketTiers.map((tier) => {
                        const isSoldOut = tier.sold >= tier.quantity;
                        const remaining = tier.quantity - tier.sold;
                        
                        return (
                          <div
                            key={tier.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isSoldOut 
                                ? 'bg-white/5 border-white/10 opacity-60' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                            style={{ borderLeftColor: tier.color, borderLeftWidth: 4 }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{tier.emoji}</span>
                                <span className="text-white font-semibold">{tier.name}</span>
                                {isSoldOut && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Sold Out</span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold">{formatPrice(tier.price)}</p>
                                {!isSoldOut && (
                                  <p className="text-white/40 text-xs">{remaining} left</p>
                                )}
                              </div>
                            </div>
                            {tier.perks.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {tier.perks.map((perk, i) => (
                                  <span key={i} className="text-white/50 text-xs flex items-center gap-1">
                                    <span className="text-green-400">✓</span>
                                    {perk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {event.addOns && event.addOns.length > 0 && (
                  <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <span>🎁</span>
                      Available Add-ons
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {event.addOns.map((addOn) => {
                        const isSoldOut = addOn.quantity !== undefined && addOn.sold >= addOn.quantity;
                        
                        return (
                          <div
                            key={addOn.id}
                            className={`p-3 rounded-xl bg-white/5 border border-white/10 ${isSoldOut ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span>{addOn.emoji}</span>
                              <span className="text-white font-medium text-sm">{addOn.name}</span>
                            </div>
                            <p className="text-purple-400 font-semibold text-sm">{formatPrice(addOn.price)}</p>
                            {addOn.description && (
                              <p className="text-white/40 text-xs mt-1">{addOn.description}</p>
                            )}
                            {isSoldOut && (
                              <p className="text-red-400 text-xs mt-1">Sold out</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Plus-ones & Group Registration Info */}
                {(event.allowPlusOnes || event.allowGroupRegistration) && (
                  <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <span>ℹ️</span>
                      Registration Options
                    </h3>
                    <div className="space-y-3">
                      {event.allowPlusOnes && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <span className="text-xl">👥</span>
                          <div>
                            <p className="text-white font-medium text-sm">Plus-Ones Allowed</p>
                            <p className="text-white/50 text-xs">
                              Bring up to {event.maxPlusOnes || 1} guest{(event.maxPlusOnes || 1) > 1 ? 's' : ''}
                              {(event.plusOneCost || 0) > 0 && ` (+${formatPrice(event.plusOneCost || 0)} each)`}
                            </p>
                          </div>
                        </div>
                      )}
                      {event.allowGroupRegistration && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <span className="text-xl">🏆</span>
                          <div>
                            <p className="text-white font-medium text-sm">Group Registration</p>
                            <p className="text-white/50 text-xs">
                              Teams of {event.minGroupSize}-{event.maxGroupSize} members
                              {(event.groupDiscount || 0) > 0 && ` • ${event.groupDiscount}% group discount`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo Gallery */}
                {event.gallery && event.gallery.length > 0 && (
                  <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <span>📸</span>
                      Photos
                      <span className="text-white/40 text-sm font-normal">({event.gallery.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {event.gallery.map((img, index) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setSelectedImage(img.url)}
                          className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                        >
                          <img
                            src={img.url}
                            alt={`Event photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl">
                              🔍
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                {event.quickLinks && event.quickLinks.filter(l => l.enabled && l.url).length > 0 && (
                  <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <span>🔗</span>
                      Links
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {event.quickLinks.filter(l => l.enabled && l.url).map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <span>{link.label}</span>
                          <span className="text-white/40">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Links */}
                {event.links && event.links.length > 0 && (
                  <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <span>📎</span>
                      Resources
                    </h3>
                    <div className="flex flex-col gap-2">
                      {event.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-purple-400 text-sm hover:bg-white/10 transition-colors group"
                        >
                          <span className="truncate flex-1">{link.url}</span>
                          <span className="text-white/40 group-hover:text-white/60">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right - Info Card */}
              <div className="space-y-4">
                {/* Main Info Card */}
                <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-5">
                  {/* Title */}
                  <h1 className="text-white text-2xl font-bold leading-tight">
                    {event.name}
                  </h1>

                  {/* Price badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.hasMultipleTiers && event.ticketTiers && event.ticketTiers.length > 0 ? (
                      <>
                        {(() => {
                          const prices = event.ticketTiers.map(t => t.price);
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          const isFree = minPrice === 0 && maxPrice === 0;
                          
                          return (
                            <>
                              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                isFree ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
                              }`}>
                                {formatPriceRange(minPrice, maxPrice)}
                              </span>
                              <span className="text-white/50 text-sm">{event.ticketTiers!.length} ticket options</span>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold ${
                            event.costPerPerson === 0
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {formatPrice(event.costPerPerson)}
                        </span>
                        <span className="text-white/50 text-sm">per person</span>
                      </>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <svg
                        className="w-6 h-6 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{dateStr}</p>
                      <p className="text-white/50 text-sm">{timeStr}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                      <svg
                        className="w-6 h-6 text-pink-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{event.location}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 text-sm hover:underline"
                      >
                        View on map ↗
                      </a>
                    </div>
                  </div>

                  {/* Host */}
                  <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                    {event.hostAvatar ? (
                      <img
                        src={event.hostAvatar}
                        alt={event.hostName}
                        className="w-12 h-12 rounded-full border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {event.hostName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-white/50 text-sm">Hosted by</p>
                      <p className="text-white font-medium">{event.hostName}</p>
                    </div>
                  </div>
                </div>

                {/* Capacity Card */}
                <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/70 text-sm">Attendees</span>
                    <span className="text-white font-medium">
                      {event.attendeeCount}
                      {event.capacity && ` / ${event.capacity}`}
                    </span>
                  </div>

                  {capacityPercent !== null && (
                    <>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
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
                      {spotsLeft !== null && spotsLeft > 0 && (
                        <p className="text-white/50 text-sm">
                          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Host Panel (for event hosts) */}
                {getHostPanel()}

                {/* Action Button (for non-hosts) */}
                {getActionButton()}

                {/* Share button */}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share Event
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Join Event Modal */}
      {event && (
        <JoinEventModal
          event={event}
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />
      )}

      {/* Share Event Modal */}
      {event && (
        <ShareEventModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          eventName={event.name}
          eventUrl={window.location.href}
          eventDescription={event.description}
        />
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white text-xl hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
          <img
            src={selectedImage}
            alt="Event photo"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
