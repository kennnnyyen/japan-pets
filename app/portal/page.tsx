import { readFileSync } from "node:fs";
import { join } from "node:path";
import Script from "next/script";

function getPortalMarkup(): string {
  const document = readFileSync(join(process.cwd(), "dist", "owner.html"), "utf8");
  const body = document.match(/<body>([\s\S]*?)<script\s+src="owner\.js"><\/script>\s*<\/body>/i);

  if (!body) {
    throw new Error("The owner portal body could not be extracted from dist/owner.html.");
  }

  return body[1];
}

export default function PortalPage() {
  return (
    <>
      <link rel="stylesheet" href="/owner.css" />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: getPortalMarkup() }} />
      <Script src="/owner.js" strategy="afterInteractive" />
    </>
  );
}
