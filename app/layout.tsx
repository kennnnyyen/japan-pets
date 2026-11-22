import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tokyo Pet OS — CRM Prototype",
  description:
    "Interactive breeding, buyer CRM, animal inventory, sales and handover prototype for the Tokyo pet platform.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#122b3f",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/platform.css" />
        <link rel="stylesheet" href="/pet-images.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
