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
import { Skeleton } from "../ui/skeleton";

export function UserCombobox({
  setSelectedUser,
  selectedUser,
}: {
  setSelectedUser: (user: string) => void;
  selectedUser?: string;
}) {
  const project_id = useParams()?.project_id as string;
  const [open, setOpen] = useState(false);
  const [userIds, setUserIds] = useState<string[]>([]);

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
      toast.error("Failed to fetch user ids");
    },
  });

  if (fetchUserIds.isLoading) {
    return <Skeleton className="h-8 w-44 rounded-md" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedUser ? selectedUser : "Filter by user id..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search user ids..." />
          <CommandEmpty>No User IDs found.</CommandEmpty>
          <CommandGroup>
            {userIds.length > 0 ? (
              userIds.map((id: string) => (
                <CommandItem
                  key={id}
                  value={id}
                  onSelect={(currentValue) => {
                    setSelectedUser(
                      currentValue === selectedUser ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedUser === id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {id}
                </CommandItem>
              ))
            ) : (
              <CommandItem className="p-2 text-xs flex items-center justify-center">
                No User IDs found.
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
