"use client";

import { Check, ChevronsUpDown, PlusIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Dataset } from "@prisma/client";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { CreateDataset } from "../project/dataset/create";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export function AddtoDataset({
  projectId,
  selectedData,
  disabled = false,
  className,
}: {
  projectId?: string;
  selectedData?: CheckedData[];
  disabled?: boolean;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={"sm"}
          disabled={disabled || selectedData!.length === 0}
          className={cn(className)}
        >
          Add to Dataset
          <PlusIcon className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Dataset</DialogTitle>
          <DialogDescription>
            Add the selected items to a dataset.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-left">
            Select a dataset
          </Label>
          <DatasetCombobox
            projectId={projectId!}
            setSelectedDatasetId={setSelectedDatasetId}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={busy || !selectedDatasetId}
            onClick={async () => {
              setBusy(true);
              try {
                await fetch(`/api/data`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    projectId,
                    datas: selectedData,
                    datasetId: selectedDatasetId,
                  }),
                });
                selectedData!.forEach((data) => {
                  queryClient.invalidateQueries({
                    queryKey: ["fetch-data-query", data.spanId],
                  });
                });
                setBusy(false);
                setOpen(false);
                toast.success("Data added to dataset.");
              } catch (error) {
                toast.error("Failed to add data to dataset.");
              }
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DatasetCombobox({
  projectId,
  setSelectedDatasetId,
}: {
  projectId: string;
  setSelectedDatasetId: (datasetId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [datasetId, setDatasetId] = React.useState("");

  const fetchDatasets = useQuery({
    queryKey: ["fetch-datasets-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/dataset?id=${projectId}`);
      const result = await response.json();
      return result;
    },
  });

  if (fetchDatasets.isLoading || !fetchDatasets.data) {
    return <div>Loading...</div>; // this componenet isn't being used, will add updated loading later
  } else {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {datasetId
              ? fetchDatasets.data?.datasets?.find(
                  (dataset: Dataset) => dataset.id === datasetId
                )?.name
              : "Select dataset..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search framework..." />
            <CommandEmpty>No dataset found.</CommandEmpty>
            <CommandGroup>
              {fetchDatasets.data?.datasets?.map((dataset: Dataset) => (
                <CommandItem
                  key={dataset.id}
                  value={dataset.id}
                  onSelect={(currentValue) => {
                    setDatasetId(
                      currentValue === datasetId ? "" : currentValue
                    );
                    setSelectedDatasetId(
                      currentValue === datasetId ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      datasetId === dataset.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {dataset.name}
                </CommandItem>
              ))}
              <CommandItem>
                <CreateDataset variant={"ghost"} projectId={projectId} />
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
}
