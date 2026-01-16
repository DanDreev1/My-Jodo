type IconProps = { className?: string };

export function MusicIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 30 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.25 1.25C3.48875 1.25 1.25 3.48875 1.25 6.25V23.75C1.25 26.5113 3.48875 28.75 6.25 28.75H23.75C26.5112 28.75 28.75 26.5113 28.75 23.75V6.25C28.75 3.5 26.5 1.25 23.75 1.25H6.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.66667"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.99025 11.6736V18.3261C9.99025 19.6098 11.3765 20.4136 12.4902 19.7773L19.149 16.4511C20.2715 15.8098 20.2715 14.1911 19.149 13.5486L12.4902 10.2223C11.3765 9.58609 9.99025 10.3911 9.99025 11.6736Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.66667"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
