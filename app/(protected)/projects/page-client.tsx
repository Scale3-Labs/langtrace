"use client";

import { Create } from "@/components/project/create";
import { Edit } from "@/components/project/edit";
import CardLoading from "@/components/shared/card-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Project } from "@prisma/client";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useQuery } from "react-query";

export default function PageClient({ email }: { email: string }) {
  const fetchProjects = useQuery({
    queryKey: ["fetch-projects-query"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?email=${email}`);
      const result = await response.json();
      return result;
    },
  });

  const fetchUser = useQuery({
    queryKey: ["fetch-user-query"],
    queryFn: async () => {
      const response = await fetch(`/api/user?email=${email}`);
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchProjects.isLoading ||
    !fetchProjects.data ||
    fetchUser.isLoading ||
    !fetchUser.data
  ) {
    return <ProjectsPageLoading />;
  }

  return (
    <div className="w-full flex flex-col">
      <div className="md:px-52 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <Create teamId={fetchUser.data.data.Team.id} />
      </div>
      <div
        className={cn(
          "md:px-52 px-12 py-12 flex md:flex-row flex-col gap-2 items-center",
          fetchProjects.data.data.projects.length === 0
            ? "md:items-center"
            : "md:items-start"
        )}
      >
        <div
          className={cn(
            "flex w-full gap-12 flex-wrap",
            fetchProjects.data.data.projects.length === 0
              ? "flex-col items-center"
              : "md:flex-row flex-wrap flex-col md:items-start items-center"
          )}
        >
          {fetchProjects.data.data.projects.length === 0 && (
            <div className="flex flex-col gap-2 items-center">
              <p className="text-2xl text-muted-foreground">Welcome!</p>
              <p className="text-lg text-muted-foreground mb-2">
                Create a new project to get started
              </p>
              <Create teamId={fetchUser.data.data.Team.id} />
            </div>
          )}
          {fetchProjects.data.data.projects.map(
            (project: Project, i: number) => (
              <ProjectCard
                key={i}
                project={project}
                teamId={fetchUser.data.data.Team.id}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  key,
  project,
  teamId,
}: {
  key: number;
  project: Project;
  teamId: string;
}) {
  const fetchProjecStats = useQuery({
    queryKey: [`fetch-project-stats-${project.id}`],
    queryFn: async () => {
      const response = await fetch(
        `/api/stats/project?projectId=${project.id}`
      );
      const result = await response.json();
      return result;
    },
  });

  return (
    <div className="relative" key={key}>
      <div className="flex items-center flex-row gap-2 absolute top-2 right-2 z-10">
        {!fetchProjecStats.isLoading &&
          fetchProjecStats.data &&
          fetchProjecStats.data.totalSpans === 0 && (
            <Link
              href={`/project/${project.id}/traces`}
              className="cursor-pointer flex flex-row gap-2 h-8 text bg-orange-300 hover:bg-orange-400 dark:bg-orange-600 dark:hover:bg-orange-700 p-2 rounded-md"
            >
              <p className="text-xs text-primary font-bold">Setup Project</p>
              <ArrowTopRightIcon className="w-4 h-4 text-primary" />
            </Link>
          )}
        <Edit teamId={teamId} project={project} />
      </div>
      <Link
        href={
          !fetchProjecStats.isLoading &&
          fetchProjecStats.data &&
          fetchProjecStats.data.totalSpans === 0
            ? `/project/${project.id}/traces`
            : `/project/${project.id}/metrics`
        }
      >
        <Card className="w-full md:w-[325px] h-[180px] shadow-md hover:cursor-pointer transition-all duration-200 ease-in-out border-muted hover:border-muted-foreground border-2 hover:shadow-lg hover:bg-muted">
          <CardHeader>
            <CardTitle className="capitalize w-1/2 truncate">
              {project.name}
            </CardTitle>
            <CardDescription className="text-sm capitalize text-muted-foreground w-3/4 truncate">
              {project.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!fetchProjecStats.isLoading && fetchProjecStats.data && (
              <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-1 items-center">
                    <p className="text-sm text-muted-foreground">Traces</p>
                    <p className="text-sm font-semibold">
                      {fetchProjecStats.data.totalTraces}
                    </p>
                  </div>
                  <div className="flex flex-row gap-1 items-center">
                    <p className="text-sm text-muted-foreground">Spans</p>
                    <p className="text-sm font-semibold">
                      {fetchProjecStats.data.totalSpans}
                    </p>
                  </div>
                  <div className="flex flex-row gap-1 items-center">
                    <p className="text-sm text-muted-foreground">Evaluations</p>
                    <p className="text-sm font-semibold">
                      {fetchProjecStats.data.totalEvaluations}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-1 items-center">
                    <p className="text-sm text-muted-foreground">Datasets</p>
                    <p className="text-sm font-semibold">
                      {fetchProjecStats.data.totalDatasets}
                    </p>
                  </div>
                  <div className="flex flex-row gap-1 items-center">
                    <p className="text-sm text-muted-foreground">Prompt sets</p>
                    <p className="text-sm font-semibold">
                      {fetchProjecStats.data.totalPromptsets}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export function ProjectsPageLoading() {
  return (
    <div className="w-full flex flex-col">
      <div className="md:px-52 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <Create disabled={true} />
      </div>
      <div
        className={cn(
          "md:px-52 px-12 py-12 flex md:flex-row flex-col gap-2 items-center md:items-start"
        )}
      >
        <div
          className={cn(
            "flex w-full gap-12 flex-wrap md:flex-row flex-wrap flex-col md:items-start items-center"
          )}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <CardLoading key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
