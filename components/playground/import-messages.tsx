import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import ImportPrompt from "./import-prompt";
import ImportTraceConversation from "./import-trace-conversation";

export default function ImportMessages({
  setMessages,
  className = "",
}: {
  setMessages: any;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={"icon"}
          className={cn(className, "bg-muted")}
        >
          <DotsHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full flex flex-col gap-1">
        <ImportTraceConversation setMessages={setMessages} />
        <ImportPrompt setMessages={setMessages} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
