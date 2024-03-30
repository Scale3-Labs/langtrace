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
  ];

  return <Tabs tabs={tabs} />;
}
