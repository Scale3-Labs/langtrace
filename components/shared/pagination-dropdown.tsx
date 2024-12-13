import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const pageSizes = [
  {
    value: "1",
    label: "1 trace/page",
  },
  {
    value: "5",
    label: "5 traces/page",
  },
  {
    value: "10",
    label: "10 traces/page",
  },
  {
    value: "15",
    label: "15 traces/page",
  },
]

export function PaginationDropdown({
  value,
  setValue,
}: {
  value: string;
  setValue: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          {value
            ? pageSizes.find((pageSize) => pageSize.value === value)?.label
            : "Select page size..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No page size found.</CommandEmpty>
            <CommandGroup>
              {pageSizes.map((pageSize) => (
                <CommandItem
                  key={pageSize.value}
                  value={pageSize.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? value : currentValue)
                    setOpen(false)
                  }}
                >
                  {pageSize.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === pageSize.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
