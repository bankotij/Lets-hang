import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventDraft } from '../../../state/eventState';
import { useUser, useIsLoggedIn, useAuthActions } from '../../../state/authState';
import { eventApi } from '../../../api/eventApi';

export function GoLiveButton() {
  const navigate = useNavigate();
  const draft = useEventDraft();
  const user = useUser();
  const isLoggedIn = useIsLoggedIn();
  const { openLoginModal, incrementEventsHosted } = useAuthActions();
  const [status, setStatus] = useState<'idle' | 'publishing' | 'published'>('idle');
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);

  async function handleGoLive() {
    // Check if user is logged in
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    // Validate minimum requirements
    if (!draft.name?.trim()) {
      alert('Please enter an event name before going live!');
      return;
    }

    setStatus('publishing');
    
    // Publish the event
    const result = await eventApi.publishEvent({
      id: user!.id,
      name: user!.name,
      avatar: user!.avatar,
    });

    if (result.ok) {
      setPublishedEventId(result.data.id);
      setStatus('published');
      incrementEventsHosted();
    } else {
      alert('Failed to publish event: ' + result.error);
      setStatus('idle');
    }
  }

  if (status === 'published') {
    return (
      <div className="space-y-3">
        <div className="w-full py-4 rounded-2xl bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-400 font-semibold text-base flex items-center justify-center gap-2">
          <span>✅</span>
          <span>Event is Live!</span>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/event/${publishedEventId}`)}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
        >
          <span>👀</span>
          <span>View your event</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="w-full py-3 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-400 font-medium hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
        >
          <span>🔍</span>
          <span>Browse all events</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGoLive}
      disabled={status === 'publishing'}
      className="w-full py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-pink-400 font-semibold text-base hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {status === 'publishing' ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Publishing...</span>
        </>
      ) : (
        <>
          <span>🎉</span>
          <span>{isLoggedIn ? 'Go live' : 'Sign in to go live'}</span>
        </>
      )}
    </button>
  );
}

