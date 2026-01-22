import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

export function EventNameField() {
  const draft = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  function handleClick() {
    setIsEditing(true);
    setEditValue(draft.name || '');
  }

  async function handleBlur() {
    setIsEditing(false);

    if (editValue === (draft.name || '')) return;

    setSaving(true);
    await updateDraft({ name: editValue || '' });
    setSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder="Name your event"
        className="text-4xl font-light text-white bg-transparent outline-none border-b-2 border-white/30 focus:border-white/60 transition-colors mb-2 w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-left mb-2 group"
    >
      <h2 className="text-4xl font-light text-white/70 group-hover:text-white/90 transition-colors">
        {draft.name || 'Name your event'}
        {saving && <span className="text-base text-white/40 ml-2">...</span>}
      </h2>
    </button>
  );
}

