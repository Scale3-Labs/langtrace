"use client";
import { SetupInstructions } from "@/components/shared/setup-instructions";
import Tabs from "@/components/shared/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/constants";
import { processDspyTrace } from "@/lib/dspy_trace_util";
import { CircularProgress } from "@mui/material";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const project_id = pathname.split("/")[2];
  const href = `/project/${project_id}/dspy-experiments`;

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  const [experiments, setExperiments] = useState<string[]>([]);
  const [navLinks, setNavLinks] = useState<any[]>([]);

  const fetchTracesCall = useCallback(
    async (pageNum: number) => {
      const apiEndpoint = "/api/traces";
      const body = {
        page: pageNum,
        pageSize: PAGE_SIZE,
        projectId: project_id,
        filters: {
          filters: [
            {
              key: "experiment",
              operation: "NOT_EQUALS",
              value: "",
              type: "attribute",
            },
          ],
          operation: "OR",
        },
        group: true,
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch traces");
      }
      return await response.json();
    },
    [project_id]
  );

  const fetchTraces = useQuery({
    queryKey: ["fetch-experiments-query", page],
    queryFn: () => fetchTracesCall(page),
    onSuccess: (data) => {
      const newData = data?.traces?.result || [];
      const metadata = data?.traces?.metadata || {};

      const transformedNewData = newData.map((trace: any) => {
        return processDspyTrace(trace);
      });

      const exps: string[] = [];
      const navs: any[] = [];
      for (const trace of transformedNewData) {
        if (
          trace.experiment_name !== "" &&
          !exps.includes(trace.experiment_name)
        ) {
          exps.push(trace.experiment_name);
          navs.push({
            name: trace.experiment_name,
            value:
              trace.experiment_name !== "" ? trace.experiment_name : "default",
            href: `${href}/${trace.experiment_name}`,
          });
        }
      }

      // dedupe experiments from current and new data
      const newExperiments = Array.from(new Set([...experiments, ...exps]));
      setExperiments(newExperiments);

      // dedupe navLinks from current and new data
      const newNavLinks = [];
      for (const nav of navs) {
        if (!navLinks.find((n) => n.value === nav.value)) {
          newNavLinks.push(nav);
        }
      }
      setNavLinks([...navLinks, ...newNavLinks]);

      // route to first experiment if no experiment is selected
      if (navLinks.length > 0) {
        const experimentId = navLinks[0].value;
        if (!pathname.includes(experimentId)) {
          window.location.href = `${href}/${experimentId}`;
        }
      }

      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }
      setShowBottomLoader(false);
    },
    onError: (error) => {
      setShowBottomLoader(false);
      toast.error("Failed to fetch traces", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const scrollableDivRef: any = useBottomScrollListener(() => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowBottomLoader(true);
      fetchTraces.refetch();
    }
  });

  return (
    <div className="flex flex-col w-full">
      <div className="px-12 py-8 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Experiments</h1>
      </div>
      {!fetchTraces.isLoading && experiments.length > 0 && (
        <div className="flex gap-10 px-12 py-8">
          <Tabs
            tabs={navLinks}
            paginationLoading={showBottomLoader}
            scrollableDivRef={scrollableDivRef}
          />
          <div className="flex w-full flex-col gap-8 overflow-x-auto">
            {children}
          </div>
        </div>
      )}
      {!fetchTraces.isLoading && experiments.length === 0 && (
        <div className="flex flex-col gap-3 items-center justify-center p-4">
          <div className="flex gap-2">
            <CircularProgress size={15} />
            <p className="text-orange-500 text-sm mb-3">
              Looking for new experiments...
            </p>
          </div>
          <SetupInstructions project_id={project_id} />
        </div>
      )}
      {fetchTraces.isLoading && (
        <div className="flex gap-10 px-12 py-8">
          <div className="sticky top-20 flex h-screen w-[150px] flex-col gap-4">
            <Skeleton className="w-32 h-6 rounded-md" />
            <Skeleton className="w-32 h-6 rounded-md" />
            <Skeleton className="w-32 h-6 rounded-md" />
            <Skeleton className="w-32 h-6 rounded-md" />
          </div>
          <Skeleton className="w-full h-[75vh]" />
        </div>
      )}
    </div>
  );
}
