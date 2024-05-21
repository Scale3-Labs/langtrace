"use client";

import { CreatePromptset } from "@/components/project/dataset/create";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import CreatePromptDialog from "../shared/create-prompt-dialog";

import { Promptset } from "@prisma/client";

export interface PromptRegistryDialogProps {
  openDialog?: boolean;
  setOpenDialog: (open: boolean) => void;
  passedPrompt: string;
}

export default function PromptRegistryDialog({
  openDialog = false,
  setOpenDialog,
  passedPrompt,
}: PromptRegistryDialogProps) {
  const [selectedPromptsetId, setSelectedPromptsetId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [prompts, setPrompts] = React.useState([]);

  const fetchPrompts = async () => {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/promptset?promptset_id=${selectedPromptsetId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch prompts");
      }
      const result = await response.json();
      setPrompts(result?.promptsets?.prompts || []);
      setBusy(false);
    } catch (error) {
      toast.error("Failed to fetch prompts", {
        description: error instanceof Error ? error.message : String(error),
      });
      setBusy(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save to Registry</DialogTitle>
          <DialogDescription>
            Save the selected prompt to a registry.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-left">
            Select a registry
          </Label>
          <PromptRegistryCombobox
            selectedPromptsetId={selectedPromptsetId}
            setSelectedPromptsetId={setSelectedPromptsetId}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={busy || !selectedPromptsetId}
            onClick={async () => {
              setOpen(true);
              setSelectedPromptsetId(selectedPromptsetId);
              await fetchPrompts();
            }}
          >
            Save
          </Button>
        </DialogFooter>
        <CreatePromptDialog
          open={open}
          setOpen={setOpen}
          promptsetId={selectedPromptsetId}
          passedPrompt={passedPrompt}
          showButton={false}
          version={prompts.length + 1}
          currentPrompt={prompts[0]}
          setOpenDialog={setOpenDialog}
        />
      </DialogContent>
    </Dialog>
  );
}

export function PromptRegistryCombobox({
  selectedPromptsetId,
  setSelectedPromptsetId,
}: {
  selectedPromptsetId: string;
  setSelectedPromptsetId: (promptsetId: string) => void;
}) {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];
  const [open, setOpen] = React.useState(false);

  const {
    data: promptsets,
    isLoading: promptsetsLoading,
    error: promptsetsError,
  } = useQuery({
    queryKey: ["fetch-promptsets-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/promptset?id=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch prompt sets");
      }
      const result = await response.json();

      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch prompt sets", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (promptsetsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedPromptsetId
            ? promptsets?.promptsets?.find(
                (promptset: Promptset) => promptset.id === selectedPromptsetId
              )?.name
            : "Select promptset..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandEmpty>No promptset found.</CommandEmpty>
          <CommandGroup>
            {promptsets?.promptsets?.map((promptset: Promptset) => (
              <CommandItem
                key={promptset.id}
                value={promptset.id}
                onSelect={(currentValue) => {
                  setSelectedPromptsetId(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPromptsetId === promptset.id
                      ? "opacity-100"
                      : "opacity-0"
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
