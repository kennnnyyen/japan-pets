import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tokyo Pet OS — CRM Prototype",
  description:
    "Interactive CRM, animal registry, matching, placement and follow-up prototype for the Tokyo pet platform.",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
