type IconProps = { className?: string };

export function LogoIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 37 37"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.3875 35.575C27.8799 35.575 35.575 27.8798 35.575 18.3875C35.575 8.89506 27.8799 1.19995 18.3875 1.19995C8.8951 1.19995 1.2 8.89506 1.2 18.3875C1.2 27.8798 8.8951 35.575 18.3875 35.575Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.575 12.1375H26.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1375 12.1375V23.075"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.6375 12.1375V23.075"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1375 26.2H24.6375"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.7 29.325H23.075"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
