import { useState, useRef } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

const SUGGESTED_TAGS = [
  'outdoor', 'indoor', 'free', 'family', 'adults', '21+', 
  'networking', 'casual', 'formal', 'live music', 'dj',
  'food', 'drinks', 'byob', 'dance', 'chill', 'creative',
];

export function TagsInput() {
  const { tags } = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    (tag) =>
      !tags.includes(tag) &&
      (inputValue === '' || tag.toLowerCase().includes(inputValue.toLowerCase()))
  );

  function addTag(tag: string) {
    const normalizedTag = tag.trim().toLowerCase().replace(/^#/, '');
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 5) {
      updateDraft({ tags: [...tags, normalizedTag] });
    }
    setInputValue('');
    inputRef.current?.focus();
  }

  function removeTag(tagToRemove: string) {
    updateDraft({ tags: tags.filter((t) => t !== tagToRemove) });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-white/70 text-sm font-medium">Tags</label>
        <span className="text-white/40 text-xs">{tags.length}/5</span>
      </div>

      {/* Tags display and input */}
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/20 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs"
            >
              ×
            </button>
          </span>
        ))}

        {tags.length < 5 && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? 'Add tags (e.g. outdoor, music, free)' : 'Add more...'}
            className="flex-1 min-w-[120px] bg-transparent text-white placeholder-white/40 focus:outline-none text-sm"
          />
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && tags.length < 5 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-white/40 text-xs w-full mb-1">Suggestions:</span>
          {filteredSuggestions.slice(0, 8).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="px-3 py-1 rounded-full bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 border border-white/10 transition-all"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

