import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tokyo Pet OS — Connected Commerce & Care Prototype",
  description:
    "Interactive owner portal and admin CRM prototype connecting pet discovery, sales, ownership and care services.",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
