import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function PathBreadCrumbs({
  projectId,
  datasetId,
}: {
  projectId: string;
  datasetId: string;
}) {
  const datasetHref = `/project/${projectId}/datasets/dataset/${datasetId}`;
  const evalHref = `/project/${projectId}/datasets/dataset/${datasetId}/evaluations`;
  const pathname = usePathname();
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            className={cn(
              "text-lg font-semibold",
              !pathname.includes("evaluations") ? "text-primary underline" : ""
            )}
            href={datasetHref}
          >
            Dataset
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            className={cn(
              "text-lg font-semibold",
              pathname.includes("evaluations") ? "text-primary underline" : ""
            )}
            href={evalHref}
          >
            Evaluations
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
