import { Badge } from "@/components/ui/badge";
import { cn, getVendorFromSpan, safeStringify } from "@/lib/utils";
import { GearIcon } from "@radix-ui/react-icons";
import UserLogo from "./user-logo";
import { VendorLogo } from "./vendor-metadata";

interface Message {
  role: string;
  content?: string | null;
  function_call?: any;
  function?: {
    arguments?: string;
    name?: string;
  };
  message?: {
    content?: string;
    role?: string;
  };
  text?: string;
  tool_call_id?: string;
  name?: string;
  id?: string;
  type?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface ConversationViewProps {
  span: any;
  className?: string;
}

function formatFunctionCall(content: Message | string): {
  formattedContent: string;
  functionName: string;
} {
  try {
    const parsedContent =
      typeof content === "string" ? JSON.parse(content) : content;

    if (Array.isArray(parsedContent)) {
      const functionCall = parsedContent[0];
      if (functionCall.function) {
        const args = JSON.parse(functionCall.function.arguments || "{}");
        const name = functionCall.function.name;

        const formattedArgs = Object.entries(args)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");

        return {
          formattedContent: formattedArgs,
          functionName: name,
        };
      }
    }

    if (parsedContent.function) {
      const args = JSON.parse(parsedContent.function.arguments || "{}");
      const name = parsedContent.function.name;

      const formattedArgs = Object.entries(args)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      return {
        formattedContent: formattedArgs,
        functionName: name,
      };
    }
  } catch (e) {
    console.error("Error parsing function call:", e);
  }

  return {
    formattedContent: content.toString(),
    functionName: "unknown",
  };
}

function getMessageContent(message: Message): {
  content: string;
  functionName?: string;
} {
  if (
    message?.tool_calls &&
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  ) {
    const toolCall = message.tool_calls[0];
    try {
      const args = JSON.parse(toolCall.function.arguments || "{}");
      const formattedArgs = Object.entries(args)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      return {
        content: formattedArgs,
        functionName: toolCall.function.name,
      };
    } catch (e) {
      console.error("Error parsing tool_calls arguments:", e);
      return {
        content: toolCall.function.arguments,
        functionName: toolCall.function.name,
      };
    }
  }

  if (message?.content) {
    try {
      const parsedContent = JSON.parse(message.content);
      if (Array.isArray(parsedContent) && parsedContent[0]?.function) {
        const { formattedContent, functionName } = formatFunctionCall(
          message.content
        );
        return { content: formattedContent, functionName };
      }
    } catch (e) {
      return { content: safeStringify(message.content) };
    }
    return { content: safeStringify(message.content) };
  }

  if (message?.function_call) {
    const { formattedContent, functionName } = formatFunctionCall(
      message.function_call
    );
    return { content: formattedContent, functionName };
  }

  if (message?.function) {
    const { formattedContent, functionName } = formatFunctionCall(message);
    return { content: formattedContent, functionName };
  }

  if (message?.message?.content) {
    return { content: safeStringify(message.message.content) };
  }

  if (message?.text) {
    return { content: safeStringify(message.text) };
  }

  return { content: "No content found" };
}

function MessageDisplay({
  role,
  content,
  vendor,
  isToolMessage,
  toolName,
  functionName,
}: {
  role: string;
  content: string;
  vendor: string;
  isToolMessage?: boolean;
  toolName?: string;
  functionName?: string;
}) {
  const displayName = functionName || toolName;
  const isFunction = !!functionName;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        {role === "user" ? (
          <UserLogo />
        ) : isToolMessage || isFunction ? (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <GearIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
        ) : (
          <VendorLogo variant="circular" vendor={vendor} />
        )}
        <p className="font-semibold text-md capitalize">{role}</p>
        {role === "system" && (
          <Badge variant="outline" className="text-xs">
            Prompt
          </Badge>
        )}
        {displayName && (
          <Badge variant="outline" className="text-xs">
            {displayName}
          </Badge>
        )}
      </div>
      <div
        className="text-sm bg-muted rounded-md px-2 py-4 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />
    </div>
  );
}

export default function ConversationView({
  span,
  className,
}: ConversationViewProps) {
  const attributes = span?.attributes ? JSON.parse(span.attributes) : {};
  if (!attributes) return <p className="text-md">No data found</p>;

  let prompts: string = "";
  let responses: string = "";
  if (span.events) {
    const events: any[] = JSON.parse(span.events);

    // find event with name 'gen_ai.content.prompt'
    const promptEvent = events.find(
      (event: any) => event.name === "gen_ai.content.prompt"
    );
    if (
      promptEvent &&
      promptEvent["attributes"] &&
      promptEvent["attributes"]["gen_ai.prompt"]
    ) {
      prompts = promptEvent["attributes"]["gen_ai.prompt"];
    }

    // find event with name 'gen_ai.content.completion'
    const responseEvent = events.find(
      (event: any) => event.name === "gen_ai.content.completion"
    );
    if (
      responseEvent &&
      responseEvent["attributes"] &&
      responseEvent["attributes"]["gen_ai.completion"]
    ) {
      responses = responseEvent["attributes"]["gen_ai.completion"];
    }
  }

  if (!prompts && !responses) return <p className="text-md">No data found</p>;

  const vendor = getVendorFromSpan(span);

  return (
    <div
      className={cn(
        className,
        "flex flex-col gap-8 overflow-y-scroll pr-6 max-h-screen"
      )}
    >
      {prompts?.length > 0 &&
        JSON.parse(prompts).map((prompt: Message, i: number) => {
          const role = prompt?.role ? prompt?.role?.toLowerCase() : "user";
          const { content, functionName } = getMessageContent(prompt);
          
          return (
            <MessageDisplay
              key={i}
              role={role}
              content={content}
              vendor={vendor}
              functionName={functionName}
            />
          );
        })}
      {responses?.length > 0 &&
        (typeof responses === "string" && responses.startsWith("[") ? (
          JSON.parse(responses).map((response: Message, i: number) => {
            const role =
              response?.role?.toLowerCase() ||
              response?.message?.role?.toLowerCase() ||
              "assistant";
            
            const { content, functionName } = getMessageContent(response);
            const isToolMessage = !!response.tool_call_id;
            const toolName = response.name;
            
            return (
              <MessageDisplay
                key={i}
                role={role}
                content={content}
                vendor={vendor}
                isToolMessage={isToolMessage}
                toolName={toolName}
                functionName={functionName}
              />
            );
          })
        ) : (
          // Handle case where responses is a plain string
          <MessageDisplay
            role="assistant"
            content={safeStringify(responses)}
            vendor={vendor}
          />
        ))}
    </div>
  );
}

interface ConversationMessage {
  content: string;
  role: string;
  source: string;
}

export function Conversation({
  model,
  messages,
}: {
  model: string;
  messages: ConversationMessage[];
}) {
  const vendorMetadata = model?.split("/");
  const vendor = vendorMetadata[0] || "openai";
  return (
    <div className="flex flex-col gap-8 overflow-y-scroll">
      {messages.map((message, i) => {
        const role = message.role.toLowerCase();
        const content: any = message.content;
        return (
          <MessageDisplay
            key={i}
            role={role}
            content={typeof content === "string" ? content : content[0]?.text}
            vendor={vendor}
          />
        );
      })}
    </div>
  );
}
