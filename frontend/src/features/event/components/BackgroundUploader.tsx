import { useRef, useState, useCallback } from 'react';
import { useEventDraftActions } from '../../../state/eventState';
import { readFileAsDataUrl } from '../../../utils/file';

type Props = {
  variant?: 'default' | 'bar';
};

export function BackgroundUploader({ variant = 'default' }: Props) {
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
        const result = await updateDraft({ backgroundUrl: dataUrl });
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

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  if (variant === 'bar') {
    return (
      <div className="flex flex-col gap-1">
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
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <span>🖼️</span>
          <span>{uploading ? 'Uploading...' : 'Change background'}</span>
        </button>
        {error && <span className="text-xs text-red-400 text-center">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
        className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-sm hover:bg-white/15 disabled:opacity-50 transition-colors"
      >
        📤 Upload
      </button>
      {uploading && <span className="text-xs text-white/60">Uploading...</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
