import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

export function PrivacyToggle() {
  const { isPrivate } = useEventDraft();
  const { updateDraft } = useEventDraftActions();

  function handleToggle() {
    updateDraft({ isPrivate: !isPrivate });
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isPrivate ? 'bg-amber-500/20' : 'bg-green-500/20'
            }`}
          >
            <span className="text-2xl">{isPrivate ? '🔒' : '🌐'}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">
              {isPrivate ? 'Private Event' : 'Public Event'}
            </h3>
            <p className="text-white/50 text-sm">
              {isPrivate
                ? 'Guests must request to join and wait for your approval'
                : 'Anyone can join your event directly after payment'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={handleToggle}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            isPrivate ? 'bg-amber-500' : 'bg-green-500'
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
              isPrivate ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {isPrivate && (
        <div className="mt-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <p className="text-amber-400 text-sm flex items-start gap-2">
            <span className="shrink-0">💡</span>
            <span>
              You'll receive notifications when someone requests to join. You can approve or decline each request.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

