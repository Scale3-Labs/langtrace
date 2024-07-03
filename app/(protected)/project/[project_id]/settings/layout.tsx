import ProjectSettingsTabs from "@/components/settings/project-tabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Langtrace | Settings",
  description: "Manage your account settings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      <div className="md:px-52 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Project Settings</h1>
      </div>
      <div className="flex gap-10 md:px-24 px-12 py-12">
        <ProjectSettingsTabs />
        <div className="flex w-full flex-col gap-8 overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
