import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import type { EventCategory } from '../../../types/event';

const CATEGORIES: { value: EventCategory; label: string; emoji: string }[] = [
  { value: 'party', label: 'Party', emoji: '🎉' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'food', label: 'Food', emoji: '🍕' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'other', label: 'Other', emoji: '🌟' },
];

export function CategorySelector() {
  const { category } = useEventDraft();
  const { updateDraft } = useEventDraftActions();

  function handleSelect(value: EventCategory) {
    updateDraft({ category: value });
  }

  return (
    <div className="space-y-3">
      <label className="text-white/70 text-sm font-medium">Event Category</label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => handleSelect(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat.value
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

