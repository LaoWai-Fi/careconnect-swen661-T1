export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="#1b6e7a" />
      <path
        d="M18 27c-1 0-9-5.5-9-11.5a5.5 5.5 0 0 1 9-4.2A5.5 5.5 0 0 1 27 15.5C27 21.5 19 27 18 27Z"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
