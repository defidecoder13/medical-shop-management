import { cn } from "@/src/lib/utils";

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-5 pb-10 max-w-[1400px] mx-auto", className)}>{children}</div>;
}

export function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("surface-card p-5", className)}>{children}</div>;
}
