"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function TraceRowSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="w-full h-5 my-3 mx-3" />
      <Separator orientation="horizontal" />
    </div>
  );
}
