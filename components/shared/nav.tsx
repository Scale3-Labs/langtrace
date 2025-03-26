import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

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
      name: "Traces",
      href: `/project/${id}/traces`,
    },
    {
      name: "Metrics",
      href: `/project/${id}/metrics`,
    },
    {
      name: "Human Evaluations",
      href: `/project/${id}/human-evaluations`,
    },
    {
      name: "Datasets",
      href: `/project/${id}/datasets`,
    },
    // TODO(Karthik): Deactivating this feature for now
    // {
    //   name: "Playground",
    //   href: `/project/${id}/playground`,
    // },
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
    // add to the second position
    result.splice(1, 0, {
      name: "CrewAI Dash",
      href: `/project/${id}/crewai-dash`,
    });
  }
  if (type == "dspy") {
    // add to the second position
    result.splice(1, 0, {
      name: "Experiments",
      href: `/project/${id}/dspy-experiments`,
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

  useEffect(() => {
    if (projectId) {
      setNavlinks(ProjectNavLinks(projectId));
    } else {
      setNavlinks(DashboardNavLinks);
    }
  }, [projectId]);

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
      <nav className="relative flex items-end">
        <div className="absolute bottom-0 h-[1px] bg-border w-full" />
        {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
          <div key={i} className="relative px-4 py-2 -mb-[1px]">
            <div className="h-5 w-20 bg-muted rounded-sm animate-pulse" />
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="relative flex items-end">
      <div className="absolute bottom-0 h-[1px] bg-border w-full" />
      {navlinks.map((link, i) => (
        <Link key={i} href={link.href} className="relative">
          <div
            className={cn(
              "relative px-4 py-2 -mb-[1px] group",
              "hover:bg-muted",
              pathname.includes(link.name.toLowerCase().replace(" ", "-")) && [
                "border-b-2 border-primary",
              ]
            )}
          >
            <span
              className={cn(
                "relative text-sm font-medium",
                pathname.includes(link.name.toLowerCase().replace(" ", "-"))
                  ? "text-foreground"
                  : "text-muted-foreground",
                "group-hover:text-foreground"
              )}
            >
              {link.name}
            </span>
          </div>
        </Link>
      ))}
    </nav>
  );
}
