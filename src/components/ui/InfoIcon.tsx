export function InfoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g fill="none">
        <path stroke="currentColor" strokeLinecap="round" strokeWidth={1.5} d="M12 17v-6" />
        <circle cx={1} cy={1} r={1} fill="currentColor" transform="matrix(1 0 0 -1 11 9)" />
        <path stroke="currentColor" strokeWidth={1.5} d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z" />
      </g>
    </svg>
  );
}
