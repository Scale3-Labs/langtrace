"use client";

import { useParams } from "next/navigation";
import Tabs from "../shared/tabs";

export default function DatasetTabs() {
  const id = useParams()?.project_id as string;
  const datasetId = useParams()?.dataset_id as string;
  const tabs = [
    {
      name: "Dataset",
      value: "dataset",
      href: `/project/${id}/datasets/dataset/${datasetId}`,
    },
    {
      name: "Evaluations",
      value: "evaluations",
      href: `/project/${id}/datasets/dataset/${datasetId}/evaluations`,
    },
  ];

  return <Tabs tabs={tabs} exactMatch={true} />;
}
