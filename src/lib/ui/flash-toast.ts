export interface FlashToastPayload {
  title: string;
  description?: string;
}

const FLASH_TOAST_KEY = 'atsocy.flash-toast';

export function queueFlashToast(payload: FlashToastPayload): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify(payload));
}

export function consumeFlashToast(): FlashToastPayload | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(FLASH_TOAST_KEY);
  if (!raw) return null;

  window.sessionStorage.removeItem(FLASH_TOAST_KEY);

  try {
    const parsed = JSON.parse(raw) as FlashToastPayload;
    return parsed?.title ? parsed : null;
  } catch {
    return null;
  }
}
