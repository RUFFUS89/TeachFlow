import { cn } from "../cn";

export interface BlobProps {
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
}

export function Blob({ color = "#F4D6BC", size = 280, opacity = 0.5, className }: BlobProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      style={{ opacity }}
    >
      <path
        d="M44.7,-58.5C57.4,-49.1,66.5,-34.9,69.5,-19.7C72.5,-4.5,69.4,11.7,61.6,25.6C53.8,39.5,41.4,51.1,27.3,57.5C13.2,63.8,-2.6,64.9,-17.7,60.4C-32.8,55.9,-47.2,45.7,-56.6,32.1C-66,18.5,-70.4,1.5,-67.6,-13.8C-64.8,-29.1,-54.7,-42.8,-42.1,-52.5C-29.4,-62.2,-14.7,-67.9,1.3,-69.5C17.3,-71.1,32,-67.9,44.7,-58.5Z"
        transform="translate(100 100)"
        fill={color}
      />
    </svg>
  );
}
