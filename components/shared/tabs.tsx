"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

export interface Tab {
  name: string;
  value: string;
  href: string;
}

export default function Tabs({
  tabs,
  paginationLoading = false,
  scrollableDivRef,
}: {
  tabs: Tab[];
  paginationLoading?: boolean;
  scrollableDivRef?: React.RefObject<HTMLDivElement>;
}) {
  const pathname = usePathname();

  return (
    <div
      className="sticky top-20 flex h-screen min-w-[150px] max-w-[200px] flex-col gap-2 overflow-y-scroll"
      ref={scrollableDivRef as any}
    >
      {tabs.map((tab, idx) => (
        <Link
          href={tab.href}
          key={idx}
          className={`flex items-start rounded-md p-2 text-sm hover:bg-secondary hover:text-primary capitalize ${
            pathname.includes(tab.value)
              ? "bg-muted hover:bg-muted"
              : "hover:bg-secondary hover:underline"
          }`}
        >
          {tab.name}
        </Link>
      ))}
      {paginationLoading && <Skeleton className="w-20 h-6 rounded-md" />}
    </div>
  );
}
