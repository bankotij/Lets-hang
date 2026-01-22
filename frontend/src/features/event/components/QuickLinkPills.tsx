import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import { CapacityInput } from './CapacityInput';
import { LinksInput } from './LinksInput';
import { GalleryInput } from './GalleryInput';

export function QuickLinkPills() {
  const draft = useEventDraft();
  const quickLinks = draft.quickLinks ?? [];
  const { updateDraft } = useEventDraftActions();
  const [saving, setSaving] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  async function handleToggle(id: string) {
    setSaving(id);

    const updated = quickLinks.map((link) =>
      link.id === id ? { ...link, enabled: !link.enabled } : link
    );

    await updateDraft({ quickLinks: updated });
    setSaving(null);
  }

  const capacityEnabled = quickLinks.find((l) => l.id === 'capacity')?.enabled;
  const linksEnabled = quickLinks.find((l) => l.id === 'links')?.enabled;
  const galleryEnabled = quickLinks.find((l) => l.id === 'gallery')?.enabled;

  // Split pills: disabled ones show normally, enabled ones are hidden until "Show more"
  const visiblePills = quickLinks.filter((link) => !link.enabled);
  const hiddenPills = quickLinks.filter((link) => link.enabled);

  return (
    <div className="flex flex-col gap-3">
      {/* Expanded input fields */}
      {capacityEnabled && <CapacityInput />}
      {linksEnabled && <LinksInput />}
      {galleryEnabled && <GalleryInput />}

      {/* Pill buttons row - show only disabled pills */}
      <div className="flex flex-wrap items-center gap-2">
        {visiblePills.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => handleToggle(link.id)}
            disabled={saving === link.id}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-md bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 ${
              saving === link.id ? 'opacity-50' : ''
            }`}
          >
            <span className="text-base">+</span>
            <span>{link.label}</span>
          </button>
        ))}

        {/* Show more button - only if there are hidden (enabled) pills */}
        {hiddenPills.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="text-sm text-white/40 hover:text-white/60 transition-colors ml-1"
          >
            {showMore ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Hidden pills - shown when "Show more" is clicked */}
      {showMore && hiddenPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {hiddenPills.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleToggle(link.id)}
              disabled={saving === link.id}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-md bg-white/20 text-white border border-white/30 ${
                saving === link.id ? 'opacity-50' : ''
              }`}
            >
              <span className="text-base">✕</span>
              <span>{link.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
