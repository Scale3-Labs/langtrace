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
      <HoverCardContent className="w-full whitespace-pre-wrap">
        <Markdown className={"break-all"}>{value}</Markdown>
      </HoverCardContent>
    </HoverCard>
  );
}
