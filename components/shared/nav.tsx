import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

const DashboardNavLinks = [
  {
    name: "Projects",
    href: "/projects",
  },
  {
    name: "Settings",
    href: `/settings/profile`,
  },
];

const ProjectNavLinks = (id: string) => [
  {
    name: "Playground",
    href: `/project/${id}/playground`,
  },
  {
    name: "Metrics",
    href: `/project/${id}/metrics`,
  },
  {
    name: "Traces",
    href: `/project/${id}/traces`,
  },
  {
    name: "Evaluations",
    href: `/project/${id}/evaluations`,
  },
  {
    name: "Prompts",
    href: `/project/${id}/prompts`,
  },
  {
    name: "Datasets",
    href: `/project/${id}/datasets`,
  },
];

export default function Nav() {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];
  let navlinks = DashboardNavLinks;
  if (pathname.includes("/project/")) {
    navlinks = ProjectNavLinks(projectId);
  }
  return (
    <nav className="flex items-end gap-4">
      {navlinks.map((link, i) => (
        <Link key={i} href={link.href}>
          <Button
            className={cn(
              pathname.includes(link.name.toLowerCase())
                ? "text-primary border-b border-primary rounded-b-none"
                : "text-muted-foreground",
              "hover:text-primary"
            )}
            variant="ghost"
          >
            {link.name}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
