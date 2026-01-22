import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

export function PhoneInput() {
  const draft = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [editValue, setEditValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = editValue !== null;
  const displayValue = isEditing ? editValue : (draft.phone ?? '');

  function handleFocus() {
    setEditValue(draft.phone ?? '');
  }

  async function handleBlur() {
    const newValue = editValue ?? '';
    setEditValue(null);

    if (newValue === (draft.phone ?? '')) return;

    setSaving(true);
    await updateDraft({ phone: newValue || undefined });
    setSaving(false);
  }

  async function handleSubmit() {
    if (editValue) {
      setSaving(true);
      await updateDraft({ phone: editValue });
      setSaving(false);
      setEditValue(null);
    }
  }

  return (
    <div className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30">
      <span className="text-base">📱</span>
      <input
        type="tel"
        placeholder="Your contact number (shown on ticket)"
        value={displayValue}
        onFocus={handleFocus}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white font-bold hover:bg-white/30 transition-colors disabled:opacity-50"
      >
        {saving ? '...' : '→'}
      </button>
    </div>
  );
}
