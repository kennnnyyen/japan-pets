import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDirectory = join(root, "public");

mkdirSync(publicDirectory, { recursive: true });
copyFileSync(join(root, "dist", "platform.css"), join(publicDirectory, "platform.css"));
copyFileSync(join(root, "dist", "pet-images.css"), join(publicDirectory, "pet-images.css"));
copyFileSync(join(root, "dist", "landing.css"), join(publicDirectory, "landing.css"));
copyFileSync(join(root, "dist", "owner.css"), join(publicDirectory, "owner.css"));
copyFileSync(join(root, "dist", "platform.js"), join(publicDirectory, "platform.js"));
copyFileSync(join(root, "dist", "owner.js"), join(publicDirectory, "owner.js"));

for (const asset of ["analytics-data.mjs", "analytics-view.mjs"]) {
  copyFileSync(join(root, "dist", asset), join(publicDirectory, asset));
}
