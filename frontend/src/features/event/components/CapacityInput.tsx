import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

export function CapacityInput() {
  const draft = useEventDraft();
  const capacity = draft.capacity;
  const { updateDraft } = useEventDraftActions();

  const [editValue, setEditValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = editValue !== null;
  const displayValue = isEditing ? editValue : (capacity?.toString() ?? '');

  function handleFocus() {
    setEditValue(capacity?.toString() ?? '');
  }

  async function handleBlur() {
    const newValue = editValue ? parseInt(editValue, 10) : undefined;
    setEditValue(null);

    if (newValue === capacity) return;

    setSaving(true);
    await updateDraft({ capacity: newValue });
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30">
      <span className="text-base">👥</span>
      <input
        type="number"
        placeholder="Add capacity"
        value={displayValue}
        onFocus={handleFocus}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
      />
      {saving && <span className="text-xs text-white/40">...</span>}
    </div>
  );
}

