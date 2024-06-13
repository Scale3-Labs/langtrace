import { Button } from "@/components/ui/button";
import { Copy, MoveDiagonal, X } from "lucide-react";
import { toast } from "sonner";

export function ExpandContractButton({
  index,
  expand,
  setExpand,
}: {
  index: number;
  expand: boolean;
  setExpand: (expand: boolean, index: number) => void;
}) {
  return (
    <Button
      variant={"outline"}
      size={"icon"}
      className="w-6 h-6 flex items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        setExpand(!expand, index);
      }}
    >
      {!expand && <MoveDiagonal className="text-muted-foreground" size={20} />}
      {expand && <X className="text-muted-foreground" size={20} />}
    </Button>
  );
}

export function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant={"outline"}
      size={"icon"}
      className={"w-6 h-6 flex items-center justify-center"}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
    >
      <Copy className="text-muted-foreground" size={15} />
    </Button>
  );
}

export function UtilityButton({
  index,
  expand,
  setExpand,
  text,
}: {
  index: number;
  expand: boolean;
  setExpand: (expand: boolean, index: number) => void;
  text: string;
}) {
  return (
    <div className="absolute group-hover:flex gap-0 items-center hidden top-0 right-0">
      <ExpandContractButton
        index={index}
        expand={expand}
        setExpand={setExpand}
      />
      <CopyButton text={text} />
    </div>
  );
}
