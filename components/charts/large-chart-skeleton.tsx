"use client";

import { Skeleton } from "../ui/skeleton";

export default function LargeChartSkeleton() {
  return (
    <div className="flex flex-col gap-2 border p-3 rounded-lg w-full">
      <div className="flex flex-row gap-3 h-12 font-semibold">
        <p className="text-sm text-start text-muted-foreground flex gap-1 items-center">
          <Skeleton className="w-20 h-6" />
        </p>
      </div>
      <Skeleton className="h-72" />
      <p className="text-sm text-center text-muted-foreground">
        <Skeleton className="w-20 h-6" />
      </p>
    </div>
  );
}
