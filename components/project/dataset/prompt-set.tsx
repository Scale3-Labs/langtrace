import CardLoading from "@/components/shared/card-skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { CreatePromptset } from "./create";
import { EditPromptSet } from "./edit";

export default function PromptSet({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;

  const fetchPromptsets = useQuery({
    queryKey: ["fetch-promptsets-stats-query"],
    queryFn: async () => {
      const response = await fetch(`/api/stats/promptset?id=${project_id}`);
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchPromptsets.isLoading ||
    !fetchPromptsets.data ||
    fetchPromptsets.isLoading ||
    !fetchPromptsets.data
  ) {
    return <PageLoading />;
  } else {
    return (
      <div className="w-full py-6 px-6 flex flex-col gap-4">
        <div className="w-fit">
          <CreatePromptset projectId={project_id} />
        </div>
        <div className="w-full flex flex-col md:flex-row flex-wrap gap-6 rounded-md">
          {fetchPromptsets.data?.result?.length === 0 && (
            <div className="flex flex-col gap-2 items-center justify-center w-full">
              <p className="text-center font-semibold mt-8">
                Get started by creating your first prompt set.
              </p>
              <p className="text-center text-sm text-muted-foreground w-1/2">
                Prompt Sets help you categorize and manage a set of prompts. Say
                you would like to group the prompts that give an accuracy of 90%
                of more. You can use the eval tab to add new records to any of
                the prompt sets.
              </p>
            </div>
          )}
          {fetchPromptsets.data?.result?.map((promptset: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute top-2 right-2 z-10">
                <EditPromptSet promptset={promptset?.promptset} />
              </div>
              <Link
                href={`/project/${project_id}/datasets/promptset/${promptset?.promptset.id}`}
              >
                <Card className="w-full md:w-[325px] h-[150px] shadow-md hover:cursor-pointer transition-all duration-200 ease-in-out border-muted hover:border-muted-foreground border-2 hover:shadow-lg hover:bg-muted">
                  <CardHeader>
                    <CardTitle>{promptset?.promptset.name}</CardTitle>
                    <CardDescription>
                      <div className="flex flex-col gap-2">
                        <p>{promptset?.promptset.description}</p>
                        <p className="font-semibold text-primary">
                          {promptset?.totalPrompts} records
                        </p>
                      </div>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

function PageLoading() {
  return (
    <div className="w-full py-6 px-6 flex flex-col gap-4">
      <div className="w-fit">
        <CreatePromptset disabled={true} />
      </div>
      <div
        className={cn(
          "md:px-52 px-12 py-12 flex md:flex-row flex-col gap-2 items-center md:items-start"
        )}
      >
        <div
          className={cn(
            "flex w-full gap-12 flex-wrap md:flex-row flex-wrap flex-col md:items-start items-center"
          )}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <CardLoading key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
