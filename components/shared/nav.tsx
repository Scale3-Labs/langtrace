import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
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

const ProjectNavLinks = (id: string, type = "default") => {
  const result = [
    {
      name: "Metrics",
      href: `/project/${id}/metrics`,
    },
    {
      name: "Traces",
      href: `/project/${id}/traces`,
    },
    {
      name: "Annotations",
      href: `/project/${id}/annotations`,
    },
    {
      name: "Datasets",
      href: `/project/${id}/datasets`,
    },
    {
      name: "Playground",
      href: `/project/${id}/playground`,
    },
    {
      name: "Prompts",
      href: `/project/${id}/prompts`,
    },
    {
      name: "Settings",
      href: `/project/${id}/settings/general`,
    },
  ];
  if (type == "crewai") {
    // add to the beginning
    result.unshift({
      name: "Agent Crews",
      href: `/project/${id}/agent-crews`,
    });
  }
  return result;
};

export default function Nav({}: {}) {
  const pathname = usePathname();
  const projectId = pathname.includes("/project/")
    ? pathname.split("/")[2]
    : "";
  const [navlinks, setNavlinks] = useState(DashboardNavLinks);

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["fetch-project-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/project?id=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch project");
      }
      const result = await response.json();
      setNavlinks(
        ProjectNavLinks(projectId, result?.project?.type || "default")
      );
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch project", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    enabled: !!projectId,
  });

  if (projectLoading) {
    return (
      <nav className="flex items-end gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((link, i) => (
          <Button
            key={i}
            className={cn("text-muted-foreground hover:text-primary")}
            variant="ghost"
          >
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-20 h-6 bg-muted rounded-md"></div>
            </div>
          </Button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex items-end gap-4">
      {navlinks.map((link, i) => (
        <Link key={i} href={link.href}>
          <Button
            className={cn(
              pathname.includes(link.name.toLowerCase().replace(" ", "-"))
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
