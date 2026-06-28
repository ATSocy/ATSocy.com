import { useCallback, useEffect, useRef, useState } from 'react';
import { useSaveProfileName } from '~/lib/identity/useSaveProfileName';

export interface DisplayNameEditorProps {
  /** Current display name (may be empty if none is set). */
  currentName: string | null;
  /** Raw kind-0 metadata content, so existing profile fields are preserved. */
  content: string | undefined;
  /** Called when the user submits a save; resolves true on success. */
  onSaved?: () => void;
  /** Called when the user cancels (Escape, or after a successful save). */
  onCancel?: () => void;
  /** When true, autofocus the field on mount (e.g. when toggled inline). */
  autofocus?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * DisplayNameEditor — the shared inline editor for a guest's display name.
 * Owns the input value, Enter/Escape keyboard handling, and the save call.
 *
 * Used by both `PostingAs` (create-post) and `UserMenu`, which previously each
 * reimplemented this with subtly different behavior. The trigger UI and any
 * surrounding animation stay at the call site; this component is only the field.
 */
export function DisplayNameEditor({
  currentName,
  content,
  onSaved,
  onCancel,
  autofocus = true,
  className = 'flex items-center gap-2',
  inputClassName,
}: DisplayNameEditorProps) {
  const { saveName, busy } = useSaveProfileName(content);
  const [value, setValue] = useState(currentName ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field in sync with the latest known name while not actively editing.
  useEffect(() => {
    setValue(currentName ?? '');
  }, [currentName]);

  const submit = useCallback(async () => {
    const ok = await saveName(value);
    if (ok) onSaved?.();
  }, [value, saveName, onSaved]);

  const cancel = useCallback(() => {
    setValue(currentName ?? '');
    onCancel?.();
  }, [currentName, onCancel]);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="text"
        aria-label="Set your display name"
        value={value}
        autoFocus={autofocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit();
          if (e.key === 'Escape') cancel();
        }}
        placeholder={currentName || 'Set your name'}
        className={
          inputClassName ??
          'min-w-0 flex-1 rounded-[16px] corner-squircle border border-line bg-canvas px-3 py-2 text-body-sm text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-accent'
        }
      />
      <button
        type="button"
        disabled={!value.trim() || busy}
        onClick={() => void submit()}
        className="inline-flex shrink-0 items-center justify-center rounded-[16px] corner-squircle bg-accent px-3 py-2 text-body-sm font-medium text-on-accent transition-colors hover:bg-accent disabled:opacity-40"
      >
        {busy ? '…' : 'Save'}
      </button>
    </div>
  );
}
