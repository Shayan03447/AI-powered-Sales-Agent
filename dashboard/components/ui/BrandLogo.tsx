/** Simple SVG mark for Atrium Reach */
export default function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#0F6E6A" />
      <path
        d="M8 22L16 8L24 22"
        stroke="#E8F6F4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 16.5H20.5"
        stroke="#B7E4DF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="24.5" cy="8.5" r="2.2" fill="#F4C95F" />
    </svg>
  );
}
