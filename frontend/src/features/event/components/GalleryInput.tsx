import { useRef, useState, useCallback } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import { readFileAsDataUrl } from '../../../utils/file';

export function GalleryInput() {
  const draft = useEventDraft();
  const gallery = draft.gallery ?? [];
  const { updateDraft } = useEventDraftActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);

      try {
        const newImages = await Promise.all(
          Array.from(files).map(async (file) => ({
            id: crypto.randomUUID(),
            url: await readFileAsDataUrl(file),
          }))
        );

        await updateDraft({ gallery: [...gallery, ...newImages] });
      } catch (error) {
        console.error('Failed to upload images:', error);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [gallery, updateDraft]
  );

  async function handleRemove(id: string) {
    const newGallery = gallery.filter((img) => img.id !== id);
    await updateDraft({ gallery: newGallery });
  }

  return (
    <div className="p-5 rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📸</span>
          <span className="text-white/80 text-sm font-medium">Photo Gallery</span>
        </div>
        <span className="text-white/40 text-xs">{gallery.length} photos</span>
      </div>

      {/* Gallery Grid */}
      {gallery.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {gallery.map((img) => (
            <div key={img.id} className="relative group aspect-square">
              <img
                src={img.url}
                alt="Gallery"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full text-white/80 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <span>+</span>
            <span>Add photos</span>
          </>
        )}
      </button>
    </div>
  );
}

