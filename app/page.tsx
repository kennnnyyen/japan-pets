import { readFileSync } from "node:fs";
import { join } from "node:path";
import Script from "next/script";

function getPrototypeMarkup(): string {
  const document = readFileSync(join(process.cwd(), "dist", "crm.html"), "utf8");
  const body = document.match(/<body>([\s\S]*?)<script\s+src="platform\.js"><\/script>\s*<\/body>/i);

  if (!body) {
    throw new Error("The CRM prototype body could not be extracted from dist/crm.html.");
  }

  return body[1];
}

export default function Home() {
  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: getPrototypeMarkup() }} />
      <Script src="/platform.js" strategy="afterInteractive" />
    </>
  );
}
