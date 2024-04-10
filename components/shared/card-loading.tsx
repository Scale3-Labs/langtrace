"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CardLoading() {
  return (
    <div className="relative">
      <Card className="w-full md:w-[325px] h-[180px] shadow-md hover:cursor-pointer transition-all duration-200 ease-in-out border-muted hover:border-muted-foreground border-2 hover:shadow-lg hover:bg-muted">
        <CardHeader>
          <CardTitle className="capitalize w-1/2 truncate">
            <Skeleton className="w-full h-6" />
          </CardTitle>
          <CardDescription className="text-sm capitalize text-muted-foreground w-3/4 truncate">
            <Skeleton className="w-full h-4" />
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
