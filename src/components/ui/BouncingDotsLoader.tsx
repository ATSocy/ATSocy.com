/**
 * The site's bouncing-dots loader (see `.xnn-bouncing-dots-loader` in
 * design-system.css). Three dots + shadows, pink. Sized for hero/panel use —
 * override the CSS vars on `.xnn-bouncing-dots-loader` to scale per site.
 */
export function BouncingDotsLoader({ className = '' }: { className?: string }) {
  return (
    <div
      className={`xnn-bouncing-dots-loader flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="xnn-bouncing-dots-loader__dot xnn-bouncing-dots-loader__dot--1" />
      <span className="xnn-bouncing-dots-loader__dot xnn-bouncing-dots-loader__dot--2" />
      <span className="xnn-bouncing-dots-loader__dot xnn-bouncing-dots-loader__dot--3" />
      <span className="xnn-bouncing-dots-loader__shadow xnn-bouncing-dots-loader__shadow--1" />
      <span className="xnn-bouncing-dots-loader__shadow xnn-bouncing-dots-loader__shadow--2" />
      <span className="xnn-bouncing-dots-loader__shadow xnn-bouncing-dots-loader__shadow--3" />
    </div>
  );
}
