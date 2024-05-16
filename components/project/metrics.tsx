"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useParams } from "next/navigation";
import { useState } from "react";
import { TraceLatencyChart } from "../charts/latency-chart";
import { CostChart, TokenChart } from "../charts/token-chart";
import { TraceSpanChart } from "../charts/trace-chart";
import { Separator } from "../ui/separator";

const timeRanges = [
  { label: "12 hours", value: 12 },
  { label: "1 day", value: 24 },
  { label: "3 days", value: 72 },
  { label: "5 days", value: 120 },
  { label: "7 days", value: 168 },
  { label: "30 days", value: 720 },
  { label: "60 days", value: 1440 },
];

export default function Metrics({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [lastNHours, setLastNHours] = useState(timeRanges[0].value);

  const handleTimeRangeChange = (value: number) => {
    setLastNHours(value);
  };

  const selectedLabel =
    timeRanges.find((range) => range.value === lastNHours)?.label || "12 hours";

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center">
          <p className="text-lg font-semibold pr-2">Usage</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="border p-1 rounded flex items-center bg-white">
                {selectedLabel} <ChevronDownIcon className="ml-2 h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white p-2 z-50 border border-black rounded-md">
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={String(lastNHours)}
                onValueChange={(value) => handleTimeRangeChange(Number(value))}
              >
                {timeRanges.map((range) => (
                  <DropdownMenuRadioItem
                    key={range.value}
                    value={String(range.value)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    {range.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Separator />
        <div className="flex flex-row items-center gap-5">
          <TokenChart projectId={project_id} lastNHours={lastNHours} />
          <CostChart projectId={project_id} lastNHours={lastNHours} />
          <TraceSpanChart projectId={project_id} lastNHours={lastNHours} />
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <p className="text-lg font-semibold">Latency</p>
          </div>
          <Separator />
          <TraceLatencyChart projectId={project_id} lastNHours={lastNHours} />
        </div>
      </div>
    </div>
  );
}
