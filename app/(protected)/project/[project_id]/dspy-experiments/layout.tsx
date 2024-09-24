import { Metadata } from "next";
import LayoutClient from "./layout-client";

export const metadata: Metadata = {
  title: "Langtrace | Experiments",
  description: "Manage your DSPy experiments.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutClient children={children} />;
}
