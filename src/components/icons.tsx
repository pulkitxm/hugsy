import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5m6-6-6 6 6 6" />
    </Icon>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Icon>
  );
}

export function Boxes(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 7 4v9l-7 4-7-4V7Zm-7 4 7 4 7-4m-7 4v9" />
    </Icon>
  );
}

export function Camera(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  );
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function CircleCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Icon>
  );
}

export function Copy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </Icon>
  );
}

export function Heart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.5S3 15 3 8.8A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 9 2.3C21 15 12 20.5 12 20.5Z" />
    </Icon>
  );
}

export function Laptop(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4.5" width="16" height="11.5" rx="2" />
      <path d="M2 19.5h20" />
    </Icon>
  );
}

export function Layers(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 9 5-9 5-9-5Zm-9 10 9 5 9-5" />
    </Icon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1m1.1 4.4a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </Icon>
  );
}

export function Moon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </Icon>
  );
}

export function Package(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Zm-8 4.5 8 4.5 8-4.5M12 12v9" />
    </Icon>
  );
}

export function Pause(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5v14m8-14v14" />
    </Icon>
  );
}

export function Play(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4.5v15l12-7.5Z" />
    </Icon>
  );
}

export function Plus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function RotateCcw(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />
    </Icon>
  );
}

export function SkipBack(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 5v14L9 12ZM5 5v14" />
    </Icon>
  );
}

export function SkipForward(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 5v14l10-7Zm14 0v14" />
    </Icon>
  );
}

export function Smartphone(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18h2" />
    </Icon>
  );
}

export function SquarePen(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6m-1.5-8.5a2.1 2.1 0 0 1 3 3L13 15l-4 1 1-4Z" />
    </Icon>
  );
}

export function Store(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9M3 9l2-5h14l2 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Zm7 11v-5h4v5" />
    </Icon>
  );
}

export function Sun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

export function Tablet(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" />
      <path d="M11 18h2" />
    </Icon>
  );
}

export function TerminalSquare(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3m6 0h4" />
    </Icon>
  );
}

export function Truck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 17H9m-5 0H2V6h12v11m0-7h4l4 4v3h-2m-6 0h1" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17.5" cy="18" r="2" />
    </Icon>
  );
}

export function X(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}
