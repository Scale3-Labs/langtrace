"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function SmallChartSkeleton() {
  return (
    <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-start">
          <Skeleton className="w-full h-6" />
        </p>
        <p className="text-xs text-start text-muted-foreground">
          <Skeleton className="w-full h-6" />
        </p>
      </div>
      <Skeleton className="w-full h-72" />
      <p className="text-sm text-center text-muted-foreground">
        <Skeleton className="w-full h-6" />
      </p>
    </div>
  );
}
