"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import Eval from "./eval";
import Prompts from "./prompts";

export default function Parent({ email }: { email: string }) {
  const [activeTab, setActiveTab] = useState("evaluate");
  const tabs = ["evaluate", "prompt accuracy"];

  return (
    <div className="flex flex-col w-full">
      <div className="flex gap-6 md:px-12 px-6 py-6">
        <div className="sticky top-36 flex h-[80px] min-w-[150px] flex-col gap-2">
          {tabs.map((tab, idx) => (
            <Button
              variant={"ghost"}
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`capitalize flex items-start rounded-md p-2 text-sm hover:bg-secondary hover:text-primary ${
                activeTab.includes(tab)
                  ? "bg-muted hover:bg-muted"
                  : "hover:bg-transparent hover:underline"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>
        {activeTab === "evaluate" ? (
          <Eval email={email} />
        ) : (
          <Prompts email={email} />
        )}
      </div>
    </div>
  );
}
