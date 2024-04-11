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
import { Promptset } from "@prisma/client";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { CreatePromptset } from "../project/dataset/create";

interface CheckedData {
  value: string;
  spanId: string;
}

export function AddtoPromptset({
  projectId,
  selectedData,
  disabled = false,
}: {
  projectId?: string;
  selectedData?: CheckedData[];
  disabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedPromptsetId, setSelectedPromptsetId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={"sm"} disabled={disabled || selectedData!.length === 0}>
          Add to Prompt Set
          <PlusIcon className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Prompt Set</DialogTitle>
          <DialogDescription>
            Add the selected items to a prompt set.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-left">
            Select a prompt set
          </Label>
          <PromptsetCombobox
            projectId={projectId!}
            setSelectedPromptsetId={setSelectedPromptsetId}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={busy || !selectedPromptsetId}
            onClick={async () => {
              setBusy(true);
              try {
                await fetch(`/api/promptdata`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    datas: selectedData,
                    promptsetId: selectedPromptsetId,
                  }),
                });
                selectedData!.forEach((data) => {
                  queryClient.invalidateQueries({
                    queryKey: [`fetch-promptdata-query-${data.spanId}`],
                  });
                });
                setBusy(false);
                setOpen(false);
                toast.success("Data added to promptset.");
              } catch (error) {
                toast.error("Failed to add data to promptset.");
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

export default function PromptsetCombobox({
  projectId,
  setSelectedPromptsetId,
}: {
  projectId: string;
  setSelectedPromptsetId: (promptsetId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [promptsetId, setPromptsetId] = React.useState("");

  const fetchPromptsets = useQuery({
    queryKey: ["fetch-promptsets-query"],
    queryFn: async () => {
      const response = await fetch(`/api/promptset?id=${projectId}`);
      const result = await response.json();
      return result;
    },
  });

  if (fetchPromptsets.isLoading || !fetchPromptsets.data) {
    return <div>Loading...</div>;
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
            {promptsetId
              ? fetchPromptsets.data?.promptsets?.find(
                  (promptset: Promptset) => promptset.id === promptsetId
                )?.name
              : "Select prompt set..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search framework..." />
            <CommandEmpty>No dataset found.</CommandEmpty>
            <CommandGroup>
              {fetchPromptsets.data?.promptsets?.map((promptset: Promptset) => (
                <CommandItem
                  key={promptset.id}
                  value={promptset.id}
                  onSelect={(currentValue) => {
                    setPromptsetId(
                      currentValue === promptsetId ? "" : currentValue
                    );
                    setSelectedPromptsetId(
                      currentValue === promptsetId ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      promptsetId === promptset.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {promptset.name}
                </CommandItem>
              ))}
              <CommandItem>
                <CreatePromptset variant={"ghost"} projectId={projectId} />
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
}
