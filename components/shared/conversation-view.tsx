import { getVendorFromSpan, safeStringify } from "@/lib/utils";
import UserLogo from "./user-logo";
import { VendorLogo } from "./vendor-metadata";

export default function ConversationView({ span }: { span: any }) {
  const attributes = span?.attributes ? JSON.parse(span.attributes) : {};
  if (!attributes) return <p className="text-md">No data found</p>;

  const prompts = attributes["llm.prompts"];
  const responses = attributes["llm.responses"];

  if (!prompts && !responses) return <p className="text-md">No data found</p>;

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pr-6">
      {prompts?.length > 0 &&
        JSON.parse(prompts).map((prompt: any, i: number) => {
          const role = prompt?.role ? prompt?.role?.toLowerCase() : "User";
          const content = prompt?.content
            ? safeStringify(prompt?.content)
            : prompt?.function_call
            ? safeStringify(prompt?.function_call)
            : prompt?.message?.content
            ? safeStringify(prompt?.message?.content)
            : prompt?.text
            ? safeStringify(prompt?.text)
            : "No input found";
          const vendor = getVendorFromSpan(span);
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                {role === "user" ? (
                  <UserLogo />
                ) : (
                  <VendorLogo variant="circular" vendor={vendor} />
                )}
                <p className="font-semibold text-md capitalize">{role}</p>
                {role === "system" && (
                  <p className="font-semibold text-xs capitalize p-1 rounded-md bg-muted">
                    Prompt
                  </p>
                )}
              </div>
              <div
                className="text-sm bg-muted rounded-md px-2 py-4"
                dangerouslySetInnerHTML={{
                  __html: content,
                }}
              />
            </div>
          );
        })}
      {responses?.length > 0 &&
        JSON.parse(responses).map((response: any, i: number) => {
          const role =
            response?.role?.toLowerCase() ||
            response?.message?.role ||
            "Assistant";
          const content = response?.content
            ? safeStringify(response?.content)
            : response?.function_call
            ? safeStringify(response?.function_call)
            : response?.message?.content
            ? safeStringify(response?.message?.content)
            : response?.text
            ? safeStringify(response?.text)
            : "No output found";
          const vendor = getVendorFromSpan(span);
          return (
            <div className="flex flex-col gap-2 whitespace-pre-wrap" key={i}>
              <div className="flex gap-2 items-center">
                {role === "user" ? (
                  <UserLogo />
                ) : (
                  <VendorLogo variant="circular" vendor={vendor} />
                )}
                <p className="font-semibold text-md capitalize">{role}</p>
              </div>
              <div
                className="text-sm bg-muted rounded-md px-2 py-4 break-all"
                dangerouslySetInnerHTML={{
                  __html: content,
                }}
              />
            </div>
          );
        })}
    </div>
  );
}

interface Message {
  content: string;
  role: string;
  source: string;
}

export function Conversation({
  model,
  messages,
}: {
  model: string;
  messages: Message[];
}) {
  const vendorMetadata = model?.split("/");
  const vendor = vendorMetadata[0] || "openai";
  return (
    <div className="flex flex-col gap-8 overflow-y-scroll">
      {messages.map((message, i) => {
        const role = message.role.toLowerCase();
        const content = message.content;
        return (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              {role === "user" ? <UserLogo /> : <VendorLogo vendor={vendor} />}
              <p className="font-semibold text-md capitalize">{role}</p>
              {role === "system" && (
                <p className="font-semibold text-xs capitalize p-1 rounded-md bg-muted">
                  Prompt
                </p>
              )}
            </div>
            <div
              className="text-sm bg-muted rounded-md px-2 py-4"
              dangerouslySetInnerHTML={{
                __html: content,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
