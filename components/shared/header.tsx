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
import { BOOKING_LINK } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  FileIcon,
  Lightbulb,
  LogOutIcon,
  Monitor,
  Moon,
  SettingsIcon,
  Sun,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "react-query";
import Nav from "./nav";
import { ProjectSwitcher } from "./project-switcher";
export function Header({ email }: { email: string }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const fetchUser = useQuery({
    queryKey: ["fetch-user-query", email],
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
            <Image
              src="/langtrace.png"
              alt="Langtrace AI"
              width={40}
              height={40}
              className="transition-all duration-200 hover:drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]"
            />
          </Link>
          {pathname.includes("/project/") && <ProjectSwitcher email={email} />}
        </div>
        <div className="flex items-center gap-3">
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
                <DropdownMenuItem className="w-full flex justify-between hover:bg-transparent data-[highlighted]:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    <span className="text-sm">Theme</span>
                  </div>
                  <div className="flex items-center gap-0 border rounded-md">
                    <button
                      className={cn(
                        "py-1 px-2 hover:bg-muted text-muted-foreground hover:text-foreground",
                        theme === "light" && "bg-muted text-foreground"
                      )}
                      onClick={() => setTheme("light")}
                      title="Light"
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      className={cn(
                        "py-1 px-2 hover:bg-muted text-muted-foreground hover:text-foreground",
                        theme === "dark" && "bg-muted text-foreground"
                      )}
                      onClick={() => setTheme("dark")}
                      title="Dark"
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                    <button
                      className={cn(
                        "py-1 px-2 hover:bg-muted text-muted-foreground hover:text-foreground",
                        theme === "system" && "bg-muted text-foreground"
                      )}
                      onClick={() => setTheme("system")}
                      title="System"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full flex"
                  onClick={() => {
                    window.open(
                      "https://docs.langtrace.ai/introduction",
                      "_blank"
                    );
                  }}
                >
                  <FileIcon className="h-4 w-4 mr-4" />
                  <span className="text-sm">Documentation</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings/profile" className="w-full flex">
                    <SettingsIcon className="h-4 w-4 mr-4" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full flex"
                  onClick={() => {
                    window.open(BOOKING_LINK, "_blank");
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-4" />
                  <span className="text-sm">Missing a feature?</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="w-full flex"
                  onClick={() => signOut()}
                >
                  <LogOutIcon className="h-4 w-4 mr-4" />
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
