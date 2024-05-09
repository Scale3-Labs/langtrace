import { toast } from "sonner";

export default function CodeBlock({ code }: { code: string }) {
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    return toast.success("Copied to clipboard");
  };
  return (
    <pre
      className="bg-muted px-3 py-2 rounded-md w-full"
      onClick={() => copyToClipboard(code)}
    >
      <code className="text-xs selection:bg-muted-foreground select-all">
        {code}
      </code>
    </pre>
  );
}
