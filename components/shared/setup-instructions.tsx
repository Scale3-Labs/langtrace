import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import GenerateApiKey from "./api-key";

export default function SetupInstructions({
  project_id,
}: {
  project_id: string;
}) {
  const [sdk, setSdk] = useState("typescript");

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    return toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-6 border rounded-md p-4">
      <div className="flex flex-row items-center gap-3">
        <Button
          onClick={() => setSdk("typescript")}
          variant={sdk === "typescript" ? "default" : "ghost"}
          size={"sm"}
        >
          TypeScript
        </Button>
        <Button
          onClick={() => setSdk("python")}
          variant={sdk === "python" ? "default" : "ghost"}
          size={"sm"}
        >
          Python
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          1. Install the Langtrace SDK in your application.
        </p>
        <pre
          className="text-xs p-2 rounded-md bg-muted select-all selection:bg-orange-400 dark:selection:bg-orange-600"
          onClick={() => {
            copyToClipboard(
              sdk === "typescript"
                ? "npm i @langtrase/typescript-sdk"
                : "pip install langtrace-python-sdk"
            );
          }}
        >
          {sdk === "typescript" && "npm i @langtrase/typescript-sdk"}
          {sdk === "python" && "pip install langtrace-python-sdk"}
        </pre>
      </div>
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          2. Generate and copy your API key.
        </p>
        <GenerateApiKey projectId={project_id} />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          3. Initialize the SDK with the following code snippet. Set the env
          var, LANGTRACE_API_KEY to the API key you generated.
        </p>
        {sdk === "typescript" && (
          <pre
            className="text-xs p-2 rounded-md bg-muted select-all selection:bg-orange-400 dark:selection:bg-orange-600"
            onClick={() => {
              copyToClipboard(
                "import { init } from '@langtrace-init/init';\n\ninit({ api_key: process.env.LANGTRACE_API_KEY });"
              );
            }}
          >
            {"import { init } from '@langtrace-init/init';\n\n"}
            {"init({ api_key: process.env.LANGTRACE_API_KEY });"}
          </pre>
        )}
        {sdk === "python" && (
          <pre
            className="text-xs p-2 rounded-md bg-muted select-all selection:bg-orange-400 dark:selection:bg-orange-600"
            onClick={() => {
              copyToClipboard(
                "from langtrace_python_sdk import langtrace\n\nlangtrace.init(api_key=process.env.LANGTRACE_API_KEY)"
              );
            }}
          >
            {"from langtrace_python_sdk import langtrace\n\n"}
            {"langtrace.init(api_key=process.env.LANGTRACE_API_KEY)"}
          </pre>
        )}
      </div>
    </div>
  );
}
