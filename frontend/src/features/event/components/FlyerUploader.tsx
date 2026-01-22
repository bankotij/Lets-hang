import { useRef, useState, useCallback } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import { readFileAsDataUrl } from '../../../utils/file';

type Props = {
  compact?: boolean;
};

export function FlyerUploader({ compact = false }: Props) {
  const { flyerUrl } = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const result = await updateDraft({ flyerUrl: dataUrl });
        if (!result.ok) {
          setError(result.error);
        }
      } catch {
        setError('Failed to read file');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [updateDraft]
  );

  const handleRemove = useCallback(async () => {
    setUploading(true);
    setError(null);

    const result = await updateDraft({ flyerUrl: '' });
    if (!result.ok) {
      setError(result.error);
    }
    setUploading(false);
  }, [updateDraft]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/50 hover:text-white disabled:opacity-50 transition-all shadow-lg"
          title={flyerUrl ? 'Change flyer' : 'Upload flyer'}
        >
          {uploading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </button>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="px-5 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm font-medium border border-white/10 hover:bg-black/60 hover:border-white/20 disabled:opacity-50 transition-all shadow-lg"
        >
          {flyerUrl ? '✏️ Change flyer' : '📤 Upload flyer'}
        </button>
        {flyerUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-black/30 backdrop-blur-sm text-white/70 text-sm border border-white/5 hover:bg-black/40 hover:text-white/90 disabled:opacity-50 transition-all"
          >
            Remove
          </button>
        )}
      </div>
      {uploading && (
        <span className="text-xs text-white/70">Uploading...</span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
