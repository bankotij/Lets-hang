import { useState } from 'react';

type ShareEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventUrl: string;
  eventDescription?: string;
};

export function ShareEventModal({ isOpen, onClose, eventName, eventUrl, eventDescription }: ShareEventModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `Check out this event: ${eventName}`;
  const encodedUrl = encodeURIComponent(eventUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedDescription = encodeURIComponent(eventDescription || eventName);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-500',
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: 'Twitter',
      icon: '𝕏',
      color: 'bg-black',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: 'f',
      color: 'bg-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      color: 'bg-blue-700',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-sky-500',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: 'Email',
      icon: '✉️',
      color: 'bg-gray-600',
      url: `mailto:?subject=${encodeURIComponent(`Join me at: ${eventName}`)}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    },
  ];

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: shareText,
          url: eventUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Share Event</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Event name */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <p className="text-white/50 text-sm mb-1">Sharing</p>
            <p className="text-white font-semibold truncate">{eventName}</p>
          </div>

          {/* Native share button (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full mb-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share via...
            </button>
          )}

          {/* Social share buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link.color} rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-white text-xs font-medium">{link.name}</span>
              </a>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex gap-2">
            <input
              type="text"
              value={eventUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm truncate"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

