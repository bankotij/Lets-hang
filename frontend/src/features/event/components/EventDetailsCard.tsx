import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

type FieldKey = 'dateTime' | 'location';

const detailRows: { id: FieldKey; icon: string; label: string; type: string }[] = [
  { id: 'dateTime', icon: '📅', label: 'Date and time', type: 'datetime-local' },
  { id: 'location', icon: '📍', label: 'Location', type: 'text' },
];

export function EventDetailsCard() {
  const draft = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  function handleClick(fieldId: FieldKey) {
    setEditingField(fieldId);
    setEditValue(draft[fieldId] ?? '');
  }

  async function handleBlur(fieldId: FieldKey) {
    setEditingField(null);
    
    if (editValue === (draft[fieldId] ?? '')) return;

    setSaving(true);
    await updateDraft({ [fieldId]: editValue || undefined });
    setSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent, fieldId: FieldKey) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'Escape') {
      setEditingField(null);
    }
  }

  return (
    <div className="rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30 overflow-hidden">
      {detailRows.map((row, idx) => {
        const isEditing = editingField === row.id;
        const value = draft[row.id];

        return (
          <div
            key={row.id}
            className={`w-full flex items-center gap-3 px-5 py-4 ${
              idx < detailRows.length - 1 ? 'border-b border-[#9C9C9C]/20' : ''
            }`}
          >
            <span className="text-base">{row.icon}</span>
            
            {isEditing ? (
              <input
                type={row.type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleBlur(row.id)}
                onKeyDown={(e) => handleKeyDown(e, row.id)}
                autoFocus
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/40"
                placeholder={row.label}
              />
            ) : (
              <button
                type="button"
                onClick={() => handleClick(row.id)}
                className="flex-1 text-left text-sm hover:bg-white/5 transition-colors rounded px-1 -mx-1"
              >
                {value ? (
                  <span className="text-white">{value}</span>
                ) : (
                  <span className="text-white/50">{row.label}</span>
                )}
              </button>
            )}

            {saving && editingField === row.id && (
              <span className="text-xs text-white/40">...</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
