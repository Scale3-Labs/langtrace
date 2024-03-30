import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { CreateDataset } from "./create";
import { EditDataSet } from "./edit";

export default function DataSet({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;

  const fetchDatasets = useQuery({
    queryKey: ["fetch-datasets-stats-query"],
    queryFn: async () => {
      const response = await fetch(`/api/stats/dataset?id=${project_id}`);
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchDatasets.isLoading ||
    !fetchDatasets.data ||
    fetchDatasets.isLoading ||
    !fetchDatasets.data
  ) {
    return <div>Loading...</div>;
  } else {
    return (
      <div className="w-full py-6 px-6 flex flex-col gap-4">
        <div className="w-fit">
          <CreateDataset projectId={project_id} />
        </div>
        <div className="w-full flex flex-col md:flex-row flex-wrap gap-6 rounded-md">
          {fetchDatasets.data?.result?.length === 0 && (
            <div className="flex flex-col gap-2 items-center justify-center w-full">
              <p className="text-center font-semibold mt-8">
                Get started by creating your first dataset.
              </p>
              <p className="text-center text-sm text-muted-foreground w-1/2">
                Datasets help you categorize and manage a set of input-output
                pairs. You can use the eval tab to add new records to any of the
                created datasets.
              </p>
            </div>
          )}
          {fetchDatasets.data.result.map((dataset: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute top-2 right-2 z-10">
                <EditDataSet dataset={dataset?.dataset} />
              </div>
              <Link
                href={`/project/${project_id}/datasets/dataset/${dataset?.dataset?.id}`}
              >
                <Card className="w-full md:w-[325px] h-[150px] shadow-md hover:cursor-pointer transition-all duration-200 ease-in-out border-muted hover:border-muted-foreground border-2 hover:shadow-lg hover:bg-muted">
                  <CardHeader>
                    <CardTitle>{dataset?.dataset?.name}</CardTitle>
                    <CardDescription>
                      <div className="flex flex-col gap-2">
                        <p>{dataset?.dataset?.description}</p>
                        <p className="font-semibold text-primary">
                          {dataset?.totalData} records
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
