"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Check, ChevronsUpDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useQuery } from "react-query";
import { toast } from "sonner";

export function UserCombobox({
  userId,
  setSelectedUser,
}: {
  userId: string;
  setSelectedUser: (user: string) => void;
}) {
  const project_id = useParams()?.project_id as string;
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserIdState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [showLoader, setShowLoader] = useState(false);

  const fetchUserIds = useQuery({
    queryKey: ["fetch-user-ids-query", project_id],
    queryFn: async () => {
      const response = await fetch(`/api/user-ids?projectId=${project_id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user ids");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data: { userIDs: any }) => {
      setUserIds(data?.userIDs || []);
    },
    onError: (error) => {
      setShowLoader(false);
      toast.error("Failed to fetch user ids", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (fetchUserIds.isLoading) {
    return <div>Loading...</div>;
  }

  //   const filteredAttributes = searchQuery
  //     ? SpanAttributes.filter((attribute) =>
  //         attribute.toLowerCase().includes(searchQuery.toLowerCase())
  //       ).slice(0, 10)
  //     : SpanAttributes.slice(0, 10);

  const onInputChange = (value: string) => {
    setSearchQuery(value);
  };

  //   useEffect(() => {
  //     setSelectedAttributeState(initialAttribute);
  //   }, [initialAttribute]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedUserId ? selectedUserId : "Select user id..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search attribute..."
            value={searchQuery}
            onValueChange={onInputChange}
          />
          <CommandEmpty>No attribute found.</CommandEmpty>
          <CommandGroup>
            {userIds.map((id: string) => (
              <CommandItem
                key={id}
                value={id}
                onSelect={(currentValue) => {
                  setSelectedUserIdState(
                    currentValue === selectedUserId ? "" : currentValue
                  );
                  setSelectedUser(
                    currentValue === selectedUserId ? "" : currentValue
                  );
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedUserId === id ? "opacity-100" : "opacity-0"
                  }`}
                />
                {id}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
