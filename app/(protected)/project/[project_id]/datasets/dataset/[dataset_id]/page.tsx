"use client";

import { CreateData } from "@/components/project/dataset/create-data";
import { EditData } from "@/components/project/dataset/edit-data";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";

export default function Dataset() {
  const dataset_id = useParams()?.dataset_id as string;

  const fetchDataset = useQuery({
    queryKey: [dataset_id],
    queryFn: async () => {
      const response = await fetch(`/api/dataset?dataset_id=${dataset_id}`);
      const result = await response.json();
      return result;
    },
  });

  if (fetchDataset.isLoading || !fetchDataset.data) {
    return <div>Loading...</div>;
  } else {
    return (
      <div className="w-full py-6 px-6 flex flex-col gap-4">
        <div className="flex gap-4 items-center w-fit">
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ChevronLeft className="mr-1" />
            Back
          </Button>
          <CreateData datasetId={dataset_id} />
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
          <div className="grid grid-cols-5 items-center justify-stretch gap-3 py-3 px-4 bg-muted">
            <p className="text-xs font-medium">Created at</p>
            <p className="text-xs font-medium">Input</p>
            <p className="text-xs font-medium">Output</p>
            <p className="text-xs font-medium text-end">Note</p>
          </div>
          {fetchDataset.data?.datasets &&
            fetchDataset.data?.datasets?.Data?.length === 0 && (
              <div className="flex items-center justify-center">
                <p className="text-muted-foreground">
                  No data found in this dataset
                </p>
              </div>
            )}
          {fetchDataset.data?.datasets &&
            fetchDataset.data?.datasets?.Data?.map((data: any, i: number) => {
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
                      <EditData key={data.id} idata={data} datasetId={dataset_id} />
                    </div>
                  </div>
                  <Separator orientation="horizontal" />
                </div>
              );
            })}
        </div>
      </div>
    );
  }
}
