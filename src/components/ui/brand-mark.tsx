import { cn } from "@/src/lib/utils";

/**
 * BrandMark — the Medsathi medical-cross anchor.
 * Styled with deep teal and soft mint accents according to DESIGN.md.
 */
export function BrandMark({
  size = 36,
  className,
  withGlow = false,
}: {
  size?: number;
  className?: string;
  withGlow?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center shrink-0 select-none", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {withGlow && (
        <span
          className="absolute inset-0 rounded-full blur-md opacity-30"
          style={{
            background: "linear-gradient(135deg, #062C2F, #397F7C 60%, #9CD4D2)",
          }}
        />
      )}
      <span
        className="relative w-full h-full flex items-center justify-center rounded-2xl shadow-soft border border-white/20"
        style={{
          background: "linear-gradient(135deg, #062C2F 0%, #0F494E 65%, #397F7C 130%)",
        }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.52} height={size * 0.52} fill="none" aria-hidden="true">
          <path
            d="M12 4.5v15M4.5 12h15"
            stroke="#9CD4D2"
            strokeWidth={3.4}
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}
