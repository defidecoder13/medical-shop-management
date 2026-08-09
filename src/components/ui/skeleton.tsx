import { cn } from "@/src/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** Full-page loading state: header bar + card grid placeholders. */
export function PageSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3.5 mb-6">
        <Skeleton className="w-11 h-11 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl mt-4" />
    </div>
  );
}
