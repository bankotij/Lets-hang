import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

export function DescriptionField() {
  const { description } = useEventDraft();
  const { updateDraft } = useEventDraftActions();

  const [editValue, setEditValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = editValue !== null;
  const displayValue = isEditing ? editValue : (description ?? '');

  function handleFocus() {
    setEditValue(description ?? '');
  }

  async function handleBlur() {
    const newValue = editValue ?? '';
    setEditValue(null);

    if (newValue === (description ?? '')) return;

    setSaving(true);
    setError(null);

    const result = await updateDraft({ description: newValue });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        id="event-desc"
        className="w-full px-5 py-4 rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30 text-white placeholder-white/40 text-sm outline-none resize-none min-h-[80px] transition-colors"
        placeholder="Describe your event"
        value={displayValue}
        onFocus={handleFocus}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
      />
      {saving && <span className="text-xs text-white/50">Saving...</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
