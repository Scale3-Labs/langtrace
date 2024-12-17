"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { FileIcon, LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "react-query";
import { ModeToggle } from "./mode-toggle";
import Nav from "./nav";
import { ProjectSwitcher } from "./project-switcher";

export function Header({ email }: { email: string }) {
  const pathname = usePathname();

  const fetchUser = useQuery({
    queryKey: ["fetch-user-query"],
    queryFn: async () => {
      const response = await fetch(`/api/user?email=${email}`);
      const result = await response.json();
      return result;
    },
  });

  return (
    <header className="flex flex-col gap-2 w-full px-12 z-[900] sticky top-0 bg-primary-foreground">
      <div className="flex justify-between items-center w-full pt-3">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="text-xl font-bold flex items-center gap-0"
          >
            Langtrace AI
          </Link>
          {pathname.includes("/project/") && <ProjectSwitcher email={email} />}
        </div>
        <div className="flex items-center gap-3">
          <Link href={"https://docs.langtrace.ai/introduction"} target="_blank">
            <Button variant={"secondary"} size={"sm"}>
              <FileIcon className="mr-2 h-4 w-4" />
              Docs
              <ArrowTopRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <ModeToggle />
          <DropdownMenu>
            {!fetchUser.isLoading && fetchUser.data && (
              <DropdownMenuTrigger asChild>
                {fetchUser.data?.data?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fetchUser.data?.data?.image}
                    alt="User Avatar"
                    className="rounded-full w-10 cursor-pointer"
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-full w-10 bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-800"
                  ></Button>
                )}
              </DropdownMenuTrigger>
            )}
            <DropdownMenuContent className="h-full w-56 mx-12 mt-1 overflow-x-auto z-[910]">
              <DropdownMenuLabel className="flex flex-col gap-1 break-all">
                {!fetchUser.isLoading && fetchUser.data && (
                  <p className="font-semibold">
                    {fetchUser.data?.data?.name || ""}
                  </p>
                )}
                <p className="font-normal">{email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="flex" onClick={() => signOut()}>
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Nav />
    </header>
  );
}
