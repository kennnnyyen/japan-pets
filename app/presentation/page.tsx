import type { Metadata } from "next";
import { PresentationViewer } from "./viewer";

export const metadata: Metadata = {
  title: "Tokyo Pet OS | Business presentation",
  description: "Follow Mugi’s record from the owner portal to the showroom, reporting and next week’s forecast.",
};

export default function PresentationPage() {
  return <PresentationViewer />;
}
