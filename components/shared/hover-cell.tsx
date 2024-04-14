import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Markdown from "react-markdown";

export function HoverCell({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className={className}>{value}</button>
      </HoverCardTrigger>
      <HoverCardContent className="w-[40rem] max-h-[20rem] p-4 overflow-y-scroll whitespace-pre-wrap text-sm">
        <Markdown className="break-all">{value}</Markdown>
      </HoverCardContent>
    </HoverCard>
  );
}
