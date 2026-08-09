import { cn } from "@/src/lib/utils";

/**
 * BrandMark — the Medsathi medical-cross anchor.
 * A gradient tile with a crisp "+" cross, used across the app shell, login
 * and page headers so the brand is recognizable even without the wordmark.
 */
export function BrandMark({
  size = 40,
  className,
  withGlow = false,
}: {
  size?: number;
  className?: string;
  withGlow?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {withGlow && (
        <span
          className="absolute inset-0 rounded-2xl blur-md opacity-40"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.31 0.105 262), oklch(0.53 0.22 258) 60%, oklch(0.627 0.17 160))",
          }}
        />
      )}
      <span
        className="relative w-full h-full flex items-center justify-center rounded-[30%] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-6px_rgb(15_23_42/0.45)]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.31 0.105 262) 0%, oklch(0.53 0.22 258) 55%, oklch(0.6 0.2 190) 130%)",
        }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.52} height={size * 0.52} fill="none" aria-hidden="true">
          <path
            d="M12 4.5v15M4.5 12h15"
            stroke="white"
            strokeWidth={3.4}
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}
