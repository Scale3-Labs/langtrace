import DatasetTabs from "@/components/dataset/dataset-tabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Langtrace | Dataset",
  description: "Manage your dataset.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      <div className="px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Dataset</h1>
      </div>
      <div className="flex gap-10 px-12 py-12">
        <DatasetTabs />
        <div className="flex w-full flex-col gap-8 overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
