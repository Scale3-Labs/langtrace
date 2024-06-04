"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PAGE_SIZE } from "@/lib/constants";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { useParams } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { TraceRow } from "../project/traces/trace-row";
import TraceRowSkeleton from "../project/traces/trace-row-skeleton";
import { Spinner } from "../shared/spinner";
import { Separator } from "../ui/separator";

export interface TraceDialogProps {
  openDialog?: boolean;
  setOpenDialog: (open: boolean) => void;
  //   passedTrace: string;
}

export default function ImportConversationDialog({
  openDialog = false,
  setOpenDialog,
}: //   passedTrace,
TraceDialogProps) {
  const [selectedTraceId, setSelectedTraceId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showLoader, setShowLoader] = useState(false);
  const [filters, setFilters] = useState<PropertyFilter[]>([]);
  const [enableFetch, setEnableFetch] = useState(false);
  const [utcTime, setUtcTime] = useState(true);
  //   const [utcTime, setUtcTime] = useState(true);

  useEffect(() => {
    setShowLoader(true);
    setCurrentData([]);
    setPage(1);
    setTotalPages(1);
    setEnableFetch(true);
  }, [filters]);

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchTraces.refetch();
    }
  });

  const fetchTraces = useQuery({
    queryKey: ["fetch-traces-query"],
    queryFn: async () => {
      const apiEndpoint = "/api/traces";
      const body = {
        page,
        pageSize: PAGE_SIZE,
        projectId: project_id,
        filters: [
          {
            key: "langtrace.service.type",
            operation: "EQUALS",
            value: "llm",
            type: "attribute",
          },
        ],
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
      const result = await response.json();
      console.log(result.traces.result);
      return result;
    },
    onSuccess: (data) => {
      const newData = data?.traces?.result || [];
      const metadata = data?.traces?.metadata || {};

      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];

        setCurrentData(updatedData);
      } else {
        setCurrentData(newData);
      }

      setEnableFetch(false);
      setShowLoader(false);
    },
    onError: (error) => {
      setEnableFetch(false);
      setShowLoader(false);
      toast.error("Failed to fetch traces", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    refetchOnWindowFocus: false,
    enabled: enableFetch,
  });

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Select Conversation</DialogTitle>
          <DialogDescription>
            Select the trace to import to the playground.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-left">
            Select a trace
          </Label>
          <div className="grid grid-cols-11 items-center gap-6 p-3 bg-muted">
            <p className="ml-10 text-xs font-medium">
              Time <span>&#8595;</span> ({utcTime ? "UTC" : "Local"})
            </p>
            <p className="text-xs font-medium">Namespace</p>
            <p className="text-xs font-medium">Model</p>
            <p className="text-xs font-medium col-span-2">Input</p>
            <p className="text-xs font-medium col-span-2">Output</p>
            <p className="text-xs font-medium">User ID</p>
            <p className="text-xs font-medium">Input / Output / Total Tokens</p>
            <p className="text-xs font-medium">Token Cost</p>
            <p className="text-xs font-medium">Duration(ms)</p>
          </div>
          {fetchTraces.isLoading || !fetchTraces?.data || !currentData ? (
            <PageSkeleton />
          ) : (
            <div
              className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll"
              ref={scrollableDivRef as any}
            >
              {!fetchTraces.isLoading &&
                fetchTraces?.data &&
                currentData?.map((trace: any, i: number) => {
                  return (
                    <div key={i} className="flex flex-col gap-3 px-3">
                      <TraceRow trace={trace} utcTime={utcTime} /> <Separator />
                    </div>
                  );
                })}
              {showLoader && (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8 text-center" />
                </div>
              )}
              {!fetchTraces.isLoading &&
                fetchTraces?.data &&
                currentData?.length === 0 &&
                !showLoader && (
                  <div className="flex flex-col gap-3 items-center justify-center p-4">
                    <p className="text-muted-foreground text-sm mb-3">
                      No traces available. Get started by setting up Langtrace
                      in your application.
                    </p>
                    {/* <SetupInstructions project_id={project_id} /> */}
                  </div>
                )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={busy || !selectedTraceId}
            onClick={async () => {
              setOpen(true);
              setSelectedTraceId(selectedTraceId);
              //   await fetchTraces();
            }}
          >
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      {Array.from({ length: 3 }).map((_, index) => (
        <TraceRowSkeleton key={index} />
      ))}
    </div>
  );
}
