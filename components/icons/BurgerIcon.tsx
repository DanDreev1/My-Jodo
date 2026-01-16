type IconProps = { className?: string };

export function BurgerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 40 25"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="23"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="13"
        y1="0"
        x2="13"
        y2="25"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
