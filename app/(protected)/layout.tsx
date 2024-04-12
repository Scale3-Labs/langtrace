import { Header } from "@/components/shared/header";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProjectsPageLoading } from "./projects/page-client";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <main className="min-h-screen w-full">
        <Header email={session?.user?.email as string} />
        <Separator />
        {children}
      </main>
    </Suspense>
  );
}

function PageLoading() {
  return (
    <main className="min-h-screen w-full">
      <header className="flex flex-col gap-2 w-full px-12 z-30 sticky top-0 bg-primary-foreground">
        <div className="flex justify-between items-center w-full pt-3">
          <div className="text-xl font-bold flex items-center gap-0">
            Langtrace AI
          </div>
          <div className="flex items-end gap-3">
            <Skeleton className="w-20 h-16" />
            <div className="flex flex-col mr-4">
              <p className="text-sm text-muted-foreground">
                <Skeleton className="w-20 h-16" />
              </p>
            </div>
            <Skeleton className="w-20 h-16" />
          </div>
        </div>
        <Skeleton className="w-full h-0.5" />
      </header>
      <ProjectsPageLoading />
    </main>
  );
}
