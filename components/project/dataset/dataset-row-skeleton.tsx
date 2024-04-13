"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function DatasetRowSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-5 items-start justify-stretch gap-3 py-3 px-4">
        <p className="text-xs">
          <Skeleton className="w-full h-6" />
        </p>
        <p className="text-xs h-12 overflow-y-scroll">
          <Skeleton className="w-full h-6" />
        </p>
        <p className="text-xs h-12 overflow-y-scroll">
          <Skeleton className="w-full h-6" />
        </p>
        <p className="text-xs text-end">
          <Skeleton className="w-full h-6" />
        </p>
        <div className="text-end">
          <Skeleton className="w-full h-6" />
        </div>
      </div>
      <Separator orientation="horizontal" />
    </div>
  );
}
