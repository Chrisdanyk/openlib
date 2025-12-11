import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function BookCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <div className="w-full">
        <div className="aspect-[3/4] relative overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
