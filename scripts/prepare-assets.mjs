import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDirectory = join(root, "public");

mkdirSync(publicDirectory, { recursive: true });
copyFileSync(join(root, "dist", "platform.css"), join(publicDirectory, "platform.css"));
copyFileSync(join(root, "dist", "platform.js"), join(publicDirectory, "platform.js"));
