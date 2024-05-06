"use client";
import CreatePromptDialog from "@/components/shared/create-prompt-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePathname, useRouter } from "next/navigation";

const prompts: any[] = [];

export default function PromptManagement({ email }: { email: string }) {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];
  return (
    <div className="px-12 py-12 flex flex-col gap-4">
      <DisplayPromptsView prompts={prompts} projectId={projectId} />
    </div>
  );
}

function DisplayPromptsView({
  prompts,
  projectId,
}: {
  prompts: any[];
  projectId: string;
}) {
  const router = useRouter();
  return (
    <>
      {prompts.length > 0 && (
        <div className="w-fit">
          <CreatePromptDialog
            currentPrompt={prompts.length > 0 ? prompts[0].prompt : undefined}
            currentVersion={prompts.length > 0 ? prompts[0].version : undefined}
          />
        </div>
      )}
      {prompts.length === 0 ? (
        <div className="flex flex-col gap-2 items-center justify-center text-md">
          No prompts found
          <CreatePromptDialog
            currentPrompt={prompts.length > 0 ? prompts[0].prompt : undefined}
            currentVersion={prompts.length > 0 ? prompts[0].version : undefined}
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="id">ID</TableHead>
              <TableHead className="w-[600px]">Prompt</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow
                key={prompt.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/project/${projectId}/prompts/${prompt.id}`)
                }
              >
                <TableCell>{prompt.id}</TableCell>
                <TableCell>{prompt.prompt}</TableCell>
                <TableCell>{prompt.variables.join(", ")}</TableCell>
                <TableCell>{prompt.version}</TableCell>
                <TableCell>{prompt.approved ? "Yes" : "No"}</TableCell>
                <TableCell>{prompt.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
