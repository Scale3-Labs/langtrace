import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { safeStringify } from "@/lib/utils";

export function HoverCell({
  values,
  className,
}: {
  values: any[];
  className?: string;
}) {
  if (!values || !Array.isArray(values)) {
    return null;
  }
  const contents = values.map((value, i) => {
    const role = value?.role
      ? value?.role?.toLowerCase()
      : value?.message?.role
        ? value?.message?.role
        : "User";
    const content = value?.content
      ? safeStringify(value?.content)
      : value?.function_call
        ? safeStringify(value?.function_call)
        : value?.message?.content
          ? safeStringify(value?.message?.content)
          : value?.text
            ? safeStringify(value?.text)
            : "";
    return { role, content };
  });

  if (contents.length === 0) {
    return null;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={className}
          dangerouslySetInnerHTML={{
            __html: contents[contents.length - 1].content,
          }}
        />
      </HoverCardTrigger>
      <HoverCardContent className="w-[40rem] max-h-[20rem] p-4 overflow-y-scroll whitespace-pre-wrap text-sm">
        <div className="flex flex-col gap-4">
          {contents.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <p className="font-semibold capitalize text-xs rounded-md p-1 bg-muted w-fit">
                {item.role}
              </p>
              <div
                className="break-all text-xs"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
