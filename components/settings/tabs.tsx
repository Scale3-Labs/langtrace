"use client";

import Tabs from "../shared/tabs";

export default function SettingsTabs({ role }: { role: "member" | "owner" }) {
  const tabs = [
    {
      name: "Profile",
      value: "profile",
      href: "/settings/profile",
    },
    {
      name: "Team",
      value: "team",
      href: "/settings/team",
    },
    {
      name: "Members",
      value: "members",
      href: "/settings/members",
    },
    {
      name: "API Keys",
      value: "keys",
      href: "/settings/keys",
    },
  ];

  return <Tabs tabs={tabs} />;
}
