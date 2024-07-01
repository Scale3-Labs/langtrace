"use client";

import Tabs from "../shared/tabs";

export default function ProjectSettingsTabs({}: {}) {
  const tabs = [
    {
      name: "Api Key",
      value: "apiKey",
      href: "/settings/api-key",
    },
    {
      name: "General",
      value: "general",
      href: "/settings/general",
    },
  ];

  return <Tabs tabs={tabs} />;
}
