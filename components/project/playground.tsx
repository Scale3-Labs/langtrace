"use client";

import { ApiKeyDialog } from "@/components/apiKey/api-dialog";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";

export default function Playground({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;



  const fetchProject = useQuery({
    queryKey: ["fetch-project-query"],
    queryFn: async () => {
      const response = await fetch(`/api/project?id=${project_id}`);
      const result = await response.json();
      return result;
    },
  });

  const fetchUser = useQuery({
    queryKey: ["fetch-user-query"],
    queryFn: async () => {
      const response = await fetch(`/api/user?email=${email}`);
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchProject.isLoading ||
    !fetchProject.data ||
    fetchUser.isLoading ||
    !fetchUser.data
  ) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full flex flex-col">
      <div className="md:px-52 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold text-muted-foreground capitalize">
          Playground
        </h1>
        <div>
          <ApiKeyDialog project_id={project_id} />
        </div>
      </div>
    </div>
  );
}
