export function pulsePostHref(noteId: string): string {
  return `/p?note=${encodeURIComponent(noteId)}`;
}
