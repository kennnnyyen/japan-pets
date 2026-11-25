import type { Metadata } from "next";
import { DataPlatformDemo } from "./walkthrough";

export const metadata: Metadata = {
  title: "Data Platform Demo | Tokyo Pet OS",
  description: "Follow a Tokyo Pet enquiry through the warehouse, reporting marts and showroom forecast.",
};

export default function DataPlatformPage() {
  return <DataPlatformDemo />;
}
