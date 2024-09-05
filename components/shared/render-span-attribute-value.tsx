import React from "react";
import { toast } from "sonner";

export const RenderSpanAttributeValue = ({
  value,
  data,
}: {
  value: string;
  data: any;
}) => {
  // Recursive function to render content
  const renderContent = (item: any) => {
    if (Array.isArray(item)) {
      return (
        <ul>
          {item.map((subItem, index) => (
            <li key={index}>{renderContent(subItem)}</li>
          ))}
        </ul>
      );
    } else if (typeof item === "object" && item !== null) {
      return (
        <div>
          {Object.entries(item).map(([key, v]) => (
            <div key={key}>
              <strong>{key}:</strong> {renderContent(v)}
            </div>
          ))}
        </div>
      );
    } else if (typeof item === "string") {
      // Replace line breaks with <br /> for better formatting
      return item.split("\n").map((line, index) => (
        <React.Fragment key={index}>
          {line}
          <br />
        </React.Fragment>
      ));
    } else {
      return <span>{String(item)}</span>;
    }
  };

  return (
    <div
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success("Copied to clipboard");
      }}
      className="text-xs select-all"
    >
      {renderContent(data)}
    </div>
  );
};
