import { cn } from "@/lib/utils";

export function ModuleSkeleton({
  height = "h-48",
  className,
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      <div className="bg-muted h-6 w-32 rounded" />
      <div className={cn("bg-muted/60 rounded", height)} />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="bg-muted h-4 w-24 rounded" />
      <div className="bg-muted h-10 w-48 rounded" />
      <div className="bg-muted/60 h-3 w-32 rounded" />
    </div>
  );
}
