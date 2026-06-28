import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useBlossomUpload } from '~/lib/blossom/useBlossomUpload';

const CONTROL =
  'w-full rounded-[18px] border border-line bg-canvas px-4 py-3 text-body-sm text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-accent';
const LABEL = 'block text-body-sm font-medium text-fg';

/** Per-file size cap (20 MB). */
export const MAX_MEDIA_FILE_BYTES = 20 * 1024 * 1024;

export interface UploadedMedia {
  id: string;
  name: string;
  mime: string;
  previewUrl: string;
  status: 'uploading' | 'ready' | 'error';
  imetaParts?: string[];
  error?: string;
}

function mediaId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function UploadMediaIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.5}>
        <path
          d="M6.286 19C3.919 19 2 17.104 2 14.765s1.919-4.236 4.286-4.236q.427.001.83.08m7.265-2.582a5.8 5.8 0 0 1 1.905-.321c.654 0 1.283.109 1.87.309m-11.04 2.594a5.6 5.6 0 0 1-.354-1.962C6.762 5.528 9.32 3 12.476 3c2.94 0 5.361 2.194 5.68 5.015m-11.04 2.594a4.3 4.3 0 0 1 1.55.634m9.49-3.228C20.392 8.78 22 10.881 22 13.353c0 2.707-1.927 4.97-4.5 5.52"
          opacity={0.5}
        />
        <path strokeLinejoin="round" d="M12 16v6m0-6l2 2m-2-2l-2 2" />
      </g>
    </svg>
  );
}

interface MediaUploadFieldProps {
  item: UploadedMedia | null;
  onChange: (item: UploadedMedia | null) => void;
  disabled?: boolean;
}

export function MediaUploadField({ item, onChange, disabled }: MediaUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useBlossomUpload();
  const itemRef = useRef(item);
  itemRef.current = item;
  const [hint, setHint] = useState<string | null>(null);

  const uploadFile = useCallback(async (next: UploadedMedia, file: File) => {
    try {
      const imetaParts = await upload(file);
      if (itemRef.current?.id !== next.id) return;
      onChange({ ...next, status: 'ready', imetaParts, error: undefined });
    } catch (e) {
      if (itemRef.current?.id !== next.id) return;
      onChange({
        ...next,
        status: 'error',
        error: e instanceof Error ? e.message : 'Upload failed.',
      });
    }
  }, [onChange, upload]);

  const selectFile = useCallback((file: File) => {
    setHint(null);
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setHint('Only images and video are supported.');
      return;
    }
    if (file.size > MAX_MEDIA_FILE_BYTES) {
      setHint(`File must be ${formatMegabytes(MAX_MEDIA_FILE_BYTES)} or smaller.`);
      return;
    }
    if (itemRef.current) URL.revokeObjectURL(itemRef.current.previewUrl);
    const next: UploadedMedia = {
      id: mediaId(),
      name: file.name,
      mime: file.type,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
    };
    onChange(next);
    void uploadFile(next, file);
  }, [onChange, uploadFile]);

  const removeItem = useCallback(() => {
    setHint(null);
    if (itemRef.current) URL.revokeObjectURL(itemRef.current.previewUrl);
    onChange(null);
  }, [onChange]);

  const openPicker = useCallback(() => {
    if (disabled || itemRef.current) return;
    inputRef.current?.click();
  }, [disabled]);

  useEffect(() => () => {
    if (itemRef.current) URL.revokeObjectURL(itemRef.current.previewUrl);
  }, []);

  return (
    <div>
      <label htmlFor={inputId} className={`${LABEL} mb-2`}>
        Image or video<span className="text-accent">*</span>
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*,video/*"
        disabled={disabled || !!item}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) selectFile(file);
          e.target.value = '';
        }}
      />

      {!item ? (
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          className={`${CONTROL} flex min-h-28 flex-col items-center justify-center gap-2 border-dashed text-fg-muted hover:border-accent/60 disabled:opacity-50`}
        >
          <UploadMediaIcon className="text-3xl" />
          <span className="text-body-sm text-fg">Upload an image or video</span>
          <span className="text-caption">Max {formatMegabytes(MAX_MEDIA_FILE_BYTES)}</span>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-[18px] border border-line bg-inset">
          {item.mime.startsWith('video/') ? (
            <video src={item.previewUrl} className="max-h-80 w-full object-contain" muted playsInline controls />
          ) : (
            <img src={item.previewUrl} alt="" className="max-h-80 w-full object-contain" />
          )}
          {item.status === 'uploading' && (
            <span className="absolute inset-0 flex items-center justify-center bg-canvas/70 text-body-sm text-fg">
              Uploading…
            </span>
          )}
          {item.status === 'error' && (
            <span className="absolute inset-x-0 bottom-0 bg-[var(--color-red-600)]/90 px-3 py-2 text-body-sm text-on-accent">
              {item.error ?? 'Upload failed'}
            </span>
          )}
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            disabled={disabled || item.status === 'uploading'}
            onClick={removeItem}
            className="absolute right-3 top-3 rounded-full bg-canvas/90 px-3 py-1 text-caption text-fg shadow-panel hover:bg-canvas disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}

      {hint && (
        <p className="mt-2 text-body-sm text-[var(--color-red-600)]">{hint}</p>
      )}
    </div>
  );
}
