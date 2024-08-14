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
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";

export function ProjectSwitcher({ email }: { email: string }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["fetch-projects-query", email],
    queryFn: async () => {
      const response = await fetch(`/api/projects?email=${email}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch projects");
      }
      return await response.json();
    },
    onError: (error) => {
      toast.error("Failed to fetch projects", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex w-[200px] justify-between"
        >
          <p className="truncate">
            {
              projects?.projects.filter(
                (project: any) => project.id === pathname.split("/")[2]
              )[0]?.name
            }
          </p>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] h-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search Project..." className="h-9" />
          <ScrollArea>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects?.projects
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                .map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}/${pathname.split("/")[3]}`}
                    legacyBehavior
                  >
                    <a>
                      <CommandItem
                        value={`${project.name}${project.id}`}
                        onSelect={() => setOpen(false)}
                      >
                        <div className="flex justify-between w-full cursor-pointer">
                          <p className="truncate">{project.name}</p>
                          <CheckIcon
                            className={cn(
                              "ml-auto h-4 w-4",
                              pathname.split("/")[2] === project.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    </a>
                  </Link>
                ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
