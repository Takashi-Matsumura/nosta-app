/** NTAG を貼り終えた本の印。かざせば開く＝誰かの声がある本 */
export function TagMark() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0 text-stamp"
      role="img"
      aria-label="タグあり"
    >
      <path
        d="M3.2 2.2a6 6 0 0 1 0 7.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M5.8 3.6a3.4 3.4 0 0 1 0 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="8.6" cy="6" r="0.9" fill="currentColor" />
    </svg>
  );
}
