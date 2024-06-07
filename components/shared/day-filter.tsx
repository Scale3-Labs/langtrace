import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

export const timeRanges = [
  { label: "12 hours", value: 12 },
  { label: "1 day", value: 24 },
  { label: "3 days", value: 72 },
  { label: "5 days", value: 120 },
  { label: "7 days", value: 168 },
  { label: "30 days", value: 720 },
  { label: "60 days", value: 1440 },
];

export default function DayFilter({
  lastNHours,
  setLastNHours,
}: {
  lastNHours: number;
  setLastNHours: (value: number) => void;
}) {
  const handleTimeRangeChange = (value: number) => {
    setLastNHours(value);
  };

  const selectedLabel =
    timeRanges.find((range) => range.value === lastNHours)?.label || "12 hours";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex justify-between border p-2 rounded items-center bg-muted text-md w-[100px]">
          {selectedLabel} <ChevronDownIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[100px] bg-primary-foreground p-2 z-50 border border-muted rounded-md cursor-pointer">
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={String(lastNHours)}
          onValueChange={(value) => handleTimeRangeChange(Number(value))}
        >
          {timeRanges.map((range) => (
            <DropdownMenuRadioItem
              key={range.value}
              value={String(range.value)}
              className="hover:bg-muted border-muted text-md"
            >
              {range.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
