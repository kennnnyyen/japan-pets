import { readFileSync } from "node:fs";
import { join } from "node:path";

function getLandingMarkup(): string {
  const document = readFileSync(join(process.cwd(), "dist", "landing.html"), "utf8");
  const body = document.match(/<body>([\s\S]*?)<\/body>/i);

  if (!body) {
    throw new Error("The landing page body could not be extracted from dist/landing.html.");
  }

  return body[1];
}

export default function Home() {
  return (
    <>
      <link rel="stylesheet" href="/landing.css" />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: getLandingMarkup() }} />
    </>
  );
}
