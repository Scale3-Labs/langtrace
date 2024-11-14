import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

interface ViewPromptProps {
  value: string;
  originalZodSchema: string | null;
}

export default function ViewPrompt({ value, originalZodSchema }: ViewPromptProps) {
  const [viewFormat, setViewFormat] = useState<"json" | "zod">("json");
  const [isZod, setIsZod] = useState(false);

  const isZodSchema = (str: string): boolean => {
    try {
      if (!/z\./.test(str)) return false;

      const zodPatterns = [
        /z\.(object|string|number|array|boolean|enum|union|discriminatedUnion|intersection|tuple|record|map|set|function|lazy|promise|null|undefined|any|unknown|void|never|literal|nan|symbol)/,
        /\.(min|max|email|url|uuid|cuid|length|startsWith|endsWith|includes|regex|optional|nullable|array|object)\(/,
        /z\.object\(\{[\s\S]*\}\)/
      ];

      if (!zodPatterns.some(pattern => pattern.test(str))) return false;

      const schema = new Function("z", `return ${str}`)(z);
      return schema !== undefined && typeof schema.parse === 'function';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const hasOriginalZod = originalZodSchema !== null;
    const valueIsZod = value && isZodSchema(value);
    setIsZod(Boolean(hasOriginalZod || valueIsZod));
    if (hasOriginalZod || valueIsZod) {
      setViewFormat("zod");
    }
  }, [value, originalZodSchema]);

  const displayValue = () => {
    if (isZod) {
      if (viewFormat === "json") {
        try {
          const schema = new Function("z", `return ${originalZodSchema || value}`)(z);
          return JSON.stringify(zodToJsonSchema(schema), null, 2);
        } catch (e) {
          console.error("Error converting Zod to JSON:", e);
          return originalZodSchema || value;
        }
      }
      return originalZodSchema || value;
    }
    return value;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isZod && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewFormat(viewFormat === "json" ? "zod" : "json")}
              >
                View as {viewFormat === "json" ? "Zod" : "JSON"}
              </Button>
              <Badge variant="default">Zod Schema</Badge>
            </>
          )}
        </div>
      </div>
      <CodeEditor
        value={displayValue()}
        language={viewFormat === "json" ? "json" : "typescript"}
        padding={15}
        className="rounded-md bg-background dark:bg-background border border-muted text-primary dark:text-primary"
        style={{
          fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
        }}
        readOnly
      />
    </div>
  );
}
