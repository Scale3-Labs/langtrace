"use client";

import { useParams } from "next/navigation";
import Tabs from "../shared/tabs";

export default function ProjectSettingsTabs() {
  const id = useParams()?.project_id as string;
  const tabs = [
    {
      name: "General",
      value: "general",
      href: `/project/${id}/settings/general`,
    },
    {
      name: "API Key",
      value: "api-key",
      href: `/project/${id}/settings/api-key`,
    },
  ];

  return <Tabs tabs={tabs} />;
}
