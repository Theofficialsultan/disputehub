import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DisputesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-6">
          <div className="mb-3 flex items-start justify-between">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-5/6" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}
