import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

export function LinksInput() {
  const draft = useEventDraft();
  const links = draft.links ?? [];
  const { updateDraft } = useEventDraftActions();
  const [newLink, setNewLink] = useState('');

  async function handleAddLink() {
    if (!newLink.trim()) return;

    const newLinks = [
      ...links,
      { id: crypto.randomUUID(), url: newLink.trim() },
    ];
    await updateDraft({ links: newLinks });
    setNewLink('');
  }

  async function handleRemoveLink(id: string) {
    const newLinks = links.filter((l) => l.id !== id);
    await updateDraft({ links: newLinks });
  }

  return (
    <div className="flex flex-col gap-2 p-5 rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30">
      {/* Existing links */}
      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-2">
          <span className="text-base">🔗</span>
          <span className="flex-1 text-white/80 text-sm truncate">{link.url}</span>
          <button
            type="button"
            onClick={() => handleRemoveLink(link.id)}
            className="text-white/40 hover:text-white/60 text-sm"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add new link input */}
      <div className="flex items-center gap-2">
        <span className="text-base">🔗</span>
        <input
          type="url"
          placeholder="Add link"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
          className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
        />
      </div>

      {/* Add another link button */}
      <button
        type="button"
        onClick={handleAddLink}
        className="flex items-center justify-end gap-1 text-sm text-white/60 hover:text-white/80 transition-colors"
      >
        <span>+</span>
        <span>Add another link</span>
      </button>
    </div>
  );
}

