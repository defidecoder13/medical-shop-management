import { cn } from "@/src/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** Full-page loading state: header bar + card grid placeholders. */
export function PageSkeleton() {
  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3.5 mb-5">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44 rounded-full" />
          <Skeleton className="h-3 w-64 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-28 rounded-[28px]" />
      <Skeleton className="h-80 rounded-[32px]" />
    </div>
  );
}
