import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import GenerateApiKey from "./api-key";

type SdkType = "python" | "typescript";

const pythonCodeTemplate = (apiKey: string) =>
  `# Must precede any llm module imports

from langtrace_python_sdk import langtrace

langtrace.init(api_key = '${apiKey ?? "<LANGTRACE_API_KEY>"}')`;

const typescriptCodeTemplate = (apiKey: string) =>
  `// Must precede any llm module imports

import * as Langtrace from '@langtrace/typescript-sdk'

Langtrace.init({ api_key: '${apiKey ?? "<LANGTRACE_API_KEY>"}' })`;

const installCommands = {
  python: "pip install langtrace-python-sdk",
  typescript: "npm i @langtrase/typescript-sdk",
};

const pythonExampleCode = (apiKey: string) =>
  `from langtrace_python_sdk import langtrace
from langtrace_python_sdk.utils.with_root_span import with_langtrace_root_span
# Paste this code after your langtrace init function

from openai import OpenAI

langtrace.init(
    api_key="${apiKey ?? "<YOUR API KEY>"}"
)

@with_langtrace_root_span()
def example():
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "How many states of matter are there?"
            }
        ],
    )
    print(response.choices[0].message.content)

example()`;

const typescriptExampleCode = (apiKey: string) =>
  `import * as Langtrace from "@langtrase/typescript-sdk";
// Paste this code after your langtrace init function
	import OpenAI from "openai";
	Langtrace.init({
			api_key: "${apiKey ?? "<YOUR API KEY>"}",
			batch: false,
			instrumentations: {
					openai: OpenAI,
			},
	});
	const openai = new OpenAI();

	async function example() {
			const completion = await openai.chat.completions.create({
					model: "gpt-3.5-turbo",
					messages: [
							{
									role: "system",
									content: "How many states of matter are there?",
							},
					],
			});
			console.log(completion.choices[0]);
	}

	example().then(() => {
			console.log("done");
	});`;

const CodeBlock = ({ code, onClick }: { code: string; onClick: any }) => (
  <pre
    className="text-xs p-2 rounded-md bg-muted select-all selection:bg-orange-400 dark:selection:bg-orange-600"
    onClick={onClick}
  >
    {code}
  </pre>
);

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success("Copied to clipboard");
    })
    .catch((err) => {
      console.error("Failed to copy!", err);
    });
};

export function SetupInstructions({ project_id }: { project_id: string }) {
  const [sdk, setSdk] = useState<SdkType>("python");
  const [apiKey, setApiKey] = useState("<LANGTRACE_API_KEY>");

  const handleApiKeyGenerated = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const handleCodeCopy = (code: string) => {
    copyToClipboard(code);
  };

  const sdkCodeTemplates = {
    python: pythonCodeTemplate(apiKey),
    typescript: typescriptCodeTemplate(apiKey),
  };

  const exampleCodeTemplates = {
    python: pythonExampleCode(apiKey),
    typescript: typescriptExampleCode(apiKey),
  };

  return (
    <div className="flex flex-col gap-6 border rounded-md p-4">
      <div className="flex flex-row items-center gap-3">
        <Button
          onClick={() => setSdk("python")}
          variant={sdk === "python" ? "default" : "ghost"}
          size={"sm"}
        >
          Python
        </Button>
        <Button
          onClick={() => setSdk("typescript")}
          variant={sdk === "typescript" ? "default" : "ghost"}
          size={"sm"}
        >
          TypeScript
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          1. Install the Langtrace SDK in your application.
        </p>
        <CodeBlock
          code={installCommands[sdk]}
          onClick={() => handleCodeCopy(installCommands[sdk])}
        />
      </div>
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          2. Generate and copy your API key.
        </p>
        <GenerateApiKey
          projectId={project_id}
          onApiKeyGenerated={handleApiKeyGenerated}
        />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          3. Initialize the SDK with the following code snippet
        </p>
        <CodeBlock
          code={sdkCodeTemplates[sdk]}
          onClick={() => handleCodeCopy(sdkCodeTemplates[sdk])}
        />

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Want an example to generate traces?
            </AccordionTrigger>
            <AccordionContent>
              <CodeBlock
                code={exampleCodeTemplates[sdk]}
                onClick={() => handleCodeCopy(exampleCodeTemplates[sdk])}
              />
              <Separator className="my-4" />
              <p>
                Checkout{" "}
                <a
                  href="https://docs.langtrace.ai/how-to-guides"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  Langtrace Docs
                </a>{" "}
                for detailed information on how to instrument your code.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

export function PromptInstructions({ id }: { id: string }) {
  const [sdk, setSdk] = useState<SdkType>("python");

  return (
    <div className="flex flex-col gap-6 border rounded-md p-4">
      <div className="flex flex-row items-center gap-3">
        <Button
          onClick={() => setSdk("python")}
          variant={sdk === "python" ? "default" : "ghost"}
          size={"sm"}
        >
          Python
        </Button>
        <Button
          onClick={() => setSdk("typescript")}
          variant={sdk === "typescript" ? "default" : "ghost"}
          size={"sm"}
        >
          TypeScript
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          Pass the prompt registry ID to the function.
          <br /> This will automatically fetch the currently Live prompt from
          the prompt registry. Example:
        </p>
        {sdk === "typescript" && (
          <pre
            className="text-xs p-2 rounded-md bg-muted select-all selection:bg-orange-400 dark:selection:bg-orange-600"
            onClick={() => {
              copyToClipboard(
                `
import * as Langtrace from "@langtrase/typescript-sdk";
const response = await Langtrace.getPromptFromRegistry('${id}')
// for json prompts (ex: tool calling)
// const prompt = JSON.parse(response.value)
const prompt = response.value
console.log(prompt)
`
              );
            }}
          >
            {`import * as Langtrace from "@langtrase/typescript-sdk";
// Paste this code after your langtrace init function
const response = await Langtrace.getPromptFromRegistry('${id}')
// for json prompts (ex: tool calling)
// const prompt = JSON.parse(response.value)
const prompt = response.value
console.log(prompt)
`}
          </pre>
        )}
        {sdk === "python" && (
          <pre
            className="text-xs p-2 rounded-md bg-muted select-all selection:bg-orange-400 dark:selection:bg-orange-600"
            onClick={() => {
              copyToClipboard(
                `import json
from langtrace_python_sdk import get_prompt_from_registry

response = get_prompt_from_registry('${id}')

# for json prompts (ex: tool calling)
# prompt = json.loads(prompt)
prompt = response['value']
print(prompt)
`
              );
            }}
          >
            {`import json
from langtrace_python_sdk import get_prompt_from_registry
# Paste this code after your langtrace init function
response = get_prompt_from_registry('${id}')

# for json prompts (ex: tool calling)
# prompt = json.loads(prompt)
prompt = response['value']
print(prompt)
`}
          </pre>
        )}
      </div>
    </div>
  );
}
