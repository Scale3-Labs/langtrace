import LLMPicker from "@/components/shared/llm-picker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CohereAIRole,
  Conversation,
  OpenAIRole,
} from "@/lib/types/playground_types";
import { cn } from "@/lib/utils";
import { MinusCircleIcon, PlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
}: {
  value: string;
  onChange: any;
  setFocusing?: any;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleClickOutside = (event: any) => {
    if (textAreaRef.current && !textAreaRef.current.contains(event.target)) {
      setFocusing(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (event: any) => {
    const textarea = event.target;
    onChange(textarea.value);

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <textarea
      className="rounded-md text-sm w-[290px] bg-background"
      ref={textAreaRef}
      defaultValue={value}
      onChange={handleChange}
      style={{ overflowY: "auto", resize: "none", height: "auto" }}
    />
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
  return (
    <>
      <div className="flex items-center justify-between cursor-pointer group hover:bg-muted rounded-md p-4">
        <div className="flex items-center gap-2">
          <div className="min-w-[80px]">
            <RoleBadge role={message.role} onSelect={onSelectRole} />
          </div>
          <div
            onClick={() => setEditing(true)}
            className="min-w-[290px] min-h-6"
          >
            {!editing && (
              <p
                className={cn(
                  "w-[290px] text-sm break-all",
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
    </>
  );
}

export function AddLLMChat({ onAdd }: { onAdd: (vendor: string) => void }) {
  const [vendor, setVendor] = useState("");
  return (
    <div className="w-[450px] h-[600px] rounded-lg border border-dashed border-muted-foreground flex items-center justify-center gap-1">
      <LLMPicker setVendor={setVendor} />
      <Button size={"sm"} onClick={() => onAdd(vendor)}>
        Add
        <PlusIcon className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
