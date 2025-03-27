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
      if (functionCall?.function) {
        const args = JSON.parse(functionCall.function.arguments || "{}");
        const name = functionCall.function.name;

        const formattedArgs = Object.entries(args)
          .map(([key, value]) => `${key}: ${safeStringify(value)}`)
          .join("\n");

        return {
          formattedContent: formattedArgs || "No arguments",
          functionName: name || "unknown",
        };
      }
    }

    if (parsedContent?.function) {
      const args = JSON.parse(parsedContent.function.arguments || "{}");
      const name = parsedContent.function.name;

      const formattedArgs = Object.entries(args)
        .map(([key, value]) => `${key}: ${safeStringify(value)}`)
        .join("\n");

      return {
        formattedContent: formattedArgs || "No arguments",
        functionName: name || "unknown",
      };
    }
  } catch (e) {
    console.error("Error parsing function call:", e);
  }

  return {
    formattedContent: safeStringify(content) || "No content",
    functionName: "unknown",
  };
}

function getMessageContent(message: Message): {
  content: string;
  functionName?: string;
} {
  if (!message) {
    return { content: "No content found" };
  }

  if (
    message?.tool_calls &&
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  ) {
    const toolCall = message.tool_calls[0];
    try {
      const args = JSON.parse(toolCall.function?.arguments || "{}");
      const formattedArgs = Object.entries(args)
        .map(([key, value]) => `${key}: ${safeStringify(value)}`)
        .join("\n");

      return {
        content: formattedArgs || "No arguments",
        functionName: toolCall.function?.name,
      };
    } catch (e) {
      console.error("Error parsing tool_calls arguments:", e);
      return {
        content: safeStringify(toolCall.function?.arguments) || "No arguments",
        functionName: toolCall.function?.name,
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
        return { content: formattedContent || "No content", functionName };
      }
      if (message.role === "tool") {
        try {
          const contentArray = Array.isArray(parsedContent)
            ? parsedContent
            : JSON.parse(parsedContent);

          if (Array.isArray(contentArray)) {
            const formattedContent = contentArray
              .map((item) => {
                if (typeof item === "object") {
                  return Object.entries(item)
                    .map(([key, value]) => `${key}: ${safeStringify(value)}`)
                    .join("\n");
                }
                return safeStringify(item);
              })
              .join("\n\n");

            return {
              content: formattedContent || "No content",
              functionName: message.name,
            };
          }
        } catch (e) {
          return {
            content: safeStringify(message.content),
            functionName: message.name,
          };
        }
      }
      return { content: safeStringify(parsedContent) };
    } catch (e) {
      return { content: safeStringify(message.content) };
    }
  }

  if (message?.function_call) {
    const { formattedContent, functionName } = formatFunctionCall(
      message.function_call
    );
    return { content: formattedContent || "No content", functionName };
  }

  if (message?.function) {
    const { formattedContent, functionName } = formatFunctionCall(message);
    return { content: formattedContent || "No content", functionName };
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
  const isDeveloper = role === "developer";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        {role === "user" ? (
          <UserLogo />
        ) : isDeveloper ? (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <GearIcon className="w-5 h-5 text-purple-600 dark:text-purple-300" />
          </div>
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
        {isDeveloper && (
          <Badge
            variant="outline"
            className="text-xs bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
          >
            Developer
          </Badge>
        )}
        {(isToolMessage || isFunction) && displayName && (
          <Badge
            variant="outline"
            className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
          >
            {displayName}
          </Badge>
        )}
      </div>
      <div
        className={cn(
          "text-sm rounded-md px-2 py-4 whitespace-pre-wrap",
          isDeveloper
            ? "bg-purple-50 dark:bg-purple-900/20"
            : isToolMessage || isFunction
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-muted"
        )}
        dangerouslySetInnerHTML={{
          __html: content || "No content",
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

  if (attributes["llm.prompts"] && attributes["llm.responses"]) {
    prompts = attributes["llm.prompts"];
    responses = attributes["llm.responses"];
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
        JSON.parse(prompts).map((message: Message, i: number) => {
          const role = message?.role?.toLowerCase() || "user";
          const { content, functionName } = getMessageContent(message);
          const isToolMessage = role === "tool";

          return (
            <MessageDisplay
              key={i}
              role={role}
              content={content}
              vendor={vendor}
              isToolMessage={isToolMessage}
              toolName={message?.name}
              functionName={functionName}
            />
          );
        })}
      {responses?.length > 0 &&
        (typeof responses === "string" && responses.startsWith("[") ? (
          JSON.parse(responses).map((message: Message, i: number) => {
            const role =
              message?.role?.toLowerCase() ||
              message?.message?.role ||
              "assistant";
            const { content, functionName } = getMessageContent(message);
            const isToolMessage = role === "tool";

            return (
              <MessageDisplay
                key={i}
                role={role}
                content={content}
                vendor={vendor}
                isToolMessage={isToolMessage}
                toolName={message?.name}
                functionName={functionName}
              />
            );
          })
        ) : (
          <MessageDisplay
            role="assistant"
            content={safeStringify(responses)}
            vendor={vendor}
          />
        ))}
    </div>
  );
}

interface ConversationProps {
  model: string;
  messages: Message[];
}

export function Conversation({ model, messages }: ConversationProps) {
  const vendorMetadata = model?.split("/");
  const vendor = vendorMetadata[0] || "openai";

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll">
      {messages.map((message, i) => {
        const role = message.role.toLowerCase();
        const { content, functionName } = getMessageContent(message);
        const isToolMessage = role === "tool";

        return (
          <MessageDisplay
            key={i}
            role={role}
            content={content}
            vendor={vendor}
            isToolMessage={isToolMessage}
            toolName={message?.name}
            functionName={functionName}
          />
        );
      })}
    </div>
  );
}
