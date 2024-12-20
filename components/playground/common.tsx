import PromptRegistryDialog from "@/components/playground/prompt-registry-dialog";
import LLMPicker from "@/components/shared/llm-picker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LLM_VENDORS, LLM_VENDOR_APIS } from "@/lib/constants";
import {
  CohereAIRole,
  Conversation,
  OpenAIRole,
} from "@/lib/types/playground_types";
import { cn } from "@/lib/utils";
import { MinusCircleIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export function RoleBadge({
  role,
  onSelect,
}: {
  role: OpenAIRole | CohereAIRole;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect();
      }}
      className="group-hover:bg-gray-300 dark:group-hover:bg-gray-700 text-xs font-semibold bg-muted rounded-md px-2 py-1 uppercase"
    >
      {role}
    </button>
  );
}

export function ExpandingTextArea({
  value,
  onChange,
  setFocusing,
  saveButtonRef,
  saveButtonLabel = "Save to Registry",
  busy = false,
  handleSave,
  className,
}: {
  value: string;
  busy?: boolean;
  onChange: any;
  setFocusing?: any;
  saveButtonRef: React.RefObject<HTMLButtonElement>;
  saveButtonLabel?: string;
  handleSave: (open: boolean) => void;
  className?: string;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleClickOutside = (event: any) => {
    if (
      textAreaRef.current &&
      !textAreaRef.current.contains(event.target) &&
      saveButtonRef.current &&
      !saveButtonRef.current.contains(event.target)
    ) {
      setFocusing(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (event: any) => {
    const textarea = event.target;
    onChange(textarea.value);

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <div className={cn("relative min-w-[350px]", className)}>
      <textarea
        disabled={busy}
        className="rounded-md text-sm w-[350px] bg-background pr-10 pt-5"
        ref={textAreaRef}
        defaultValue={value}
        onChange={handleChange}
        style={{ overflowY: "auto", height: "auto" }}
      />
      <div className="absolute right-1 top-0 py-2">
        <Button
          className="text-xs"
          size={"sm"}
          variant="outline"
          onClick={() => handleSave(true)}
          disabled={value === "" || busy}
          ref={saveButtonRef}
        >
          {saveButtonLabel}
        </Button>
      </div>
    </div>
  );
}

export function Message({
  message,
  setMessage,
  onRemove,
  vendor,
}: {
  message: Conversation;
  setMessage: (message: Conversation) => void;
  onRemove?: () => void;
  vendor: string;
}) {
  const onSelectRole = () => {
    if (
      message.role === OpenAIRole.user ||
      message.role === CohereAIRole.user
    ) {
      if (vendor === "cohere") {
        setMessage({ ...message, role: CohereAIRole.chatbot });
      } else {
        setMessage({ ...message, role: OpenAIRole.assistant });
      }
    } else if (message.role === OpenAIRole.assistant) {
      if (vendor === "openai") {
        setMessage({ ...message, role: OpenAIRole.system });
      } else {
        setMessage({ ...message, role: OpenAIRole.user });
      }
    } else if (message.role === CohereAIRole.chatbot) {
      setMessage({ ...message, role: CohereAIRole.user });
    } else {
      setMessage({ ...message, role: OpenAIRole.user });
    }
  };
  const [editing, setEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPromptRegistry, setSelectedPromptRegistry] =
    useState<any>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const [currentPrompt, setCurrentPrompt] = useState<any>(undefined);

  useQuery({
    queryKey: ["fetch-prompts-query", selectedPromptRegistry?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/promptset?promptset_id=${selectedPromptRegistry?.id}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch tests");
      }
      const result = await response.json();
      setCurrentPrompt(result?.promptsets?.prompts[0] || undefined);
      return result;
    },
    enabled: !!selectedPromptRegistry,
    onError: (error) => {
      toast.error("Failed to fetch prompts", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between cursor-pointer group hover:bg-muted rounded-md p-4">
        <div className="flex items-center gap-2">
          <div className="min-w-[80px]">
            <RoleBadge role={message.role} onSelect={onSelectRole} />
          </div>
          <div
            onClick={() => setEditing(true)}
            className="min-w-[350px] min-h-6"
          >
            {!editing && (
              <p
                className={cn(
                  "w-[350px] text-sm break-all",
                  !message.content && "text-muted-foreground"
                )}
              >
                {message.content || "click to edit"}
              </p>
            )}
            {editing && (
              <ExpandingTextArea
                onChange={(value: string) => {
                  setMessage({ ...message, content: value });
                }}
                value={message.content}
                setFocusing={setEditing}
                saveButtonRef={saveButtonRef}
                handleSave={setDialogOpen}
              />
            )}
          </div>
        </div>
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={(e) => {
            e.stopPropagation();
            if (onRemove) onRemove();
          }}
        >
          <MinusCircleIcon className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <PromptRegistryDialog
        openDialog={dialogOpen}
        setOpenDialog={setDialogOpen}
        passedPrompt={message.content}
      />
    </>
  );
}

export function AddLLMChat({ onAdd }: { onAdd: (vendor: string) => void }) {
  const [vendor, setVendor] = useState("");
  const [busy, setBusy] = useState(false);
  const [vendorKey, setVendorKey] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keys = LLM_VENDORS.map((vendor) => {
      const keyName = LLM_VENDOR_APIS.find(
        (api) => api.label.toUpperCase() === vendor.value.toUpperCase()
      );
      if (!keyName) return null;
      const key = window.localStorage.getItem(keyName.value.toUpperCase());
      if (!key) return null;
      return { value: keyName.value.toUpperCase(), label: vendor.label, key };
    });
    const venKey = keys.find((key) => key?.label.toLowerCase() === vendor);
    setVendorKey(venKey?.key || "");
  }, [busy, vendor]);

  return (
    <div className="w-[530px] h-[600px] rounded-lg border border-dashed border-muted-foreground flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <LLMPicker setVendor={setVendor} />
        <Button
          size={"sm"}
          onClick={() => onAdd(vendor)}
          disabled={vendorKey === "" || vendor === "" || busy}
        >
          Add
          <PlusIcon className="ml-2 h-4 w-4" />
        </Button>
      </div>
      {vendorKey === "" && (
        <span className="text-sm font-semibold w-72">
          Please add your {vendor} API key in the{" "}
          <Link href="/settings/keys" className="underline text-blue-400">
            settings page.
          </Link>
        </span>
      )}
    </div>
  );
}
