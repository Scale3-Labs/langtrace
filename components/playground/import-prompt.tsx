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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Prompt } from "@prisma/client";
import { Check, ChevronDown, SaveIcon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { PromptRegistryCombobox } from "./prompt-registry-dialog";

export interface PromptRegistryDialogProps {
  openDialog?: boolean;
  setOpenDialog: (open: boolean) => void;
  passedPrompt: string;
}

export default function ImportPrompt({
  setMessages,
}: {
  setMessages: (messages: any) => void;
}) {
  const [selectedPromptsetId, setSelectedPromptsetId] = useState("");
  const [selectedPromptVersion, setSelectedPromptVersion] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

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

  useEffect(() => {
    if (selectedPromptsetId) {
      fetchPrompts();
    }
  }, [selectedPromptsetId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          type="button"
          size="sm"
          className="w-full flex justify-start gap-2"
          variant={"ghost"}
          onClick={() => {
            setOpen(true);
          }}
        >
          <SaveIcon className="h-4 w-4" />
          Import Registry Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Prompt</DialogTitle>
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
        {!busy &&
          (prompts.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-left">
                Select prompt version
              </Label>
              <PromptVersionCombobox
                prompts={prompts}
                selectedPromptVersion={selectedPromptVersion}
                setSelectedPromptVersion={setSelectedPromptVersion}
                setSelectedPrompt={setSelectedPrompt}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-left">
                No prompts found, please select a registry
              </Label>
            </div>
          ))}
        {busy && (
          <p className="text-sm text-muted-foreground">Loading prompts...</p>
        )}
        {prompts.length > 0 && selectedPromptVersion && (
          <div className="p-2 rounded-md border border-muted h-24 overflow-y-scroll">
            <p className="text-md">
              {prompts?.find(
                (prompt: Prompt) =>
                  prompt.version.toString() === selectedPromptVersion
              )?.value || ""}
            </p>
          </div>
        )}
        <DialogFooter>
          <Button
            disabled={busy || !selectedPrompt}
            onClick={async () => {
              setOpen(false);
              setMessages([
                {
                  id: uuidv4(),
                  role: "assistant",
                  content: selectedPrompt,
                },
              ]);
            }}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            Import Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PromptVersionCombobox({
  prompts,
  selectedPromptVersion,
  setSelectedPromptVersion,
  setSelectedPrompt,
}: {
  prompts: any[];
  selectedPromptVersion: string;
  setSelectedPromptVersion: (promptsetVersion: string) => void;
  setSelectedPrompt: (prompt: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[250px] justify-between"
        >
          {selectedPromptVersion
            ? prompts?.find(
                (prompt: Prompt) =>
                  prompt.version.toString() === selectedPromptVersion
              )?.version
            : "Select prompt version..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search prompt version..." />
          <CommandEmpty>No prompt version found.</CommandEmpty>
          <CommandGroup>
            {prompts?.map((prompt: Prompt) => (
              <CommandItem
                key={prompt.id}
                value={prompt.version.toString()}
                onSelect={(currentValue) => {
                  setSelectedPromptVersion(currentValue);
                  setSelectedPrompt(
                    prompts?.find(
                      (prompt: Prompt) =>
                        prompt.version.toString() === currentValue
                    )?.value
                  );
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPromptVersion === prompt.version.toString()
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {prompt.version.toString()}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
