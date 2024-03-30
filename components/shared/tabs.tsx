"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Tab {
  name: string;
  value: string;
  href: string;
}

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-20 flex h-[80px] min-w-[150px] flex-col gap-2">
      {tabs.map((tab, idx) => (
        <Link
          href={tab.href}
          key={idx}
          className={`flex items-start rounded-md p-2 text-sm hover:bg-secondary hover:text-primary ${
            pathname.includes(tab.value)
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline"
          }`}
        >
          {tab.name}
        </Link>
      ))}
    </div>
  );
}
