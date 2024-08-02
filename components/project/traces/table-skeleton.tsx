import RowSkeleton from "@/components/shared/row-skeleton";

export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      {Array.from({ length: 20 }).map((_, index) => (
        <RowSkeleton key={index} />
      ))}
    </div>
  );
}
