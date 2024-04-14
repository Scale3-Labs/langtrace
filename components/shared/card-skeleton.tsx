"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CardSkeleton() {
  return (
    <div className="relative">
      <Card className="w-full md:w-[325px] h-[180px] shadow-md hover:cursor-pointer transition-all duration-200 ease-in-out border-muted hover:border-muted-foreground border-2 hover:shadow-lg hover:bg-muted">
        <CardHeader>
          <Skeleton className="w-full h-6" />
          <Skeleton className="w-24 h-4" />
        </CardHeader>
      </Card>
    </div>
  );
}
