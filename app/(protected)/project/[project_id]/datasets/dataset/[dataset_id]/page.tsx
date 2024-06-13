"use client";

import { CreateData } from "@/components/project/dataset/create-data";
import DatasetRowSkeleton from "@/components/project/dataset/dataset-row-skeleton";
import { EditData } from "@/components/project/dataset/edit-data";
import { DownloadDataset } from "@/components/shared/download-dataset";
import { Spinner } from "@/components/shared/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EVALUATIONS_DOCS_URL, PAGE_SIZE } from "@/lib/constants";
import { Data } from "@prisma/client";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ChevronLeft, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Dataset() {
  const projectId = useParams()?.project_id as string;
  const dataset_id = useParams()?.dataset_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showLoader, setShowLoader] = useState(false);
  const [currentData, setCurrentData] = useState<Data[]>([]);

  useBottomScrollListener(() => {
    if (fetchDataset.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchDataset.refetch();
    }
  });

  const fetchDataset = useQuery({
    queryKey: [dataset_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/dataset?dataset_id=${dataset_id}&page=${page}&pageSize=${PAGE_SIZE}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch dataset");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const newData: Data[] = data?.datasets?.Data || [];
      const metadata = data?.metadata || {};

      // Update the total pages and current page number
      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      // Merge the new data with the existing data
      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];

        // Remove duplicates
        const uniqueData = updatedData.filter(
          (v: any, i: number, a: any) =>
            a.findIndex((t: any) => t.id === v.id) === i
        );

        setCurrentData(uniqueData);
      } else {
        setCurrentData(newData);
      }
      setShowLoader(false);
    },
    onError: (error) => {
      setShowLoader(false);
      toast.error("Failed to fetch dataset", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (fetchDataset.isLoading || !fetchDataset.data || !currentData) {
    return <PageSkeleton />;
  } else {
    return (
      <div className="w-full py-6 px-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-fit">
            <Button variant="secondary" onClick={() => window.history.back()}>
              <ChevronLeft className="mr-1" />
              Back
            </Button>
            <CreateData datasetId={dataset_id} />
            <DownloadDataset
              projectId={projectId}
              datasetId={dataset_id}
              disabled={fetchDataset.isLoading || currentData?.length === 0}
            />
          </div>
          <div className="flex gap-4 items-center w-fit">
            <Badge variant={"outline"} className="text-sm">
              Dataset ID: {dataset_id}
            </Badge>
            <Link href={EVALUATIONS_DOCS_URL}>
              <Button variant="outline">
                Run Evaluation
                <FlaskConical className="ml-1 h-4 w-4" />
                <ArrowTopRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
          <div className="grid grid-cols-5 items-center justify-stretch gap-3 py-3 px-4 bg-muted">
            <p className="text-xs font-medium">Created at</p>
            <p className="text-xs font-medium">Input</p>
            <p className="text-xs font-medium">Output</p>
            <p className="text-xs font-medium text-end">Note</p>
          </div>
          {fetchDataset.isLoading && currentData?.length === 0 && (
            <div className="flex items-center justify-center">
              <p className="text-muted-foreground">
                No data found in this dataset
              </p>
            </div>
          )}
          {!fetchDataset.isLoading &&
            currentData.length > 0 &&
            currentData.map((data: any, i: number) => {
              return (
                <div className="flex flex-col" key={i}>
                  <div className="grid grid-cols-5 items-start justify-stretch gap-3 py-3 px-4">
                    <p className="text-xs">{data.createdAt}</p>
                    <p className="text-xs h-12 overflow-y-scroll">
                      {data.input}
                    </p>
                    <p className="text-xs h-12 overflow-y-scroll">
                      {data.output}
                    </p>
                    <p className="text-xs text-end">{data.note}</p>
                    <div className="text-end">
                      <EditData
                        key={data.id}
                        idata={data}
                        datasetId={dataset_id}
                      />
                    </div>
                  </div>
                  <Separator orientation="horizontal" />
                </div>
              );
            })}
          {showLoader && (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-center" />
            </div>
          )}
        </div>
      </div>
    );
  }
}

function PageSkeleton() {
  return (
    <div className="w-full py-6 px-6 flex flex-col gap-4">
      <div className="flex gap-4 items-center w-fit">
        <Button
          disabled={true}
          variant="secondary"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="mr-1" />
          Back
        </Button>
        <CreateData disabled={true} />
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
        <div className="grid grid-cols-5 items-center justify-stretch gap-3 py-3 px-4 bg-muted">
          <p className="text-xs font-medium">Created at</p>
          <p className="text-xs font-medium">Input</p>
          <p className="text-xs font-medium">Output</p>
          <p className="text-xs font-medium text-end">Note</p>
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <DatasetRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
