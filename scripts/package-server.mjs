import fs from "fs";
import path from "path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
const standaloneNext = path.join(standalone, ".next");
const staticSource = path.join(root, ".next", "static");
const staticTarget = path.join(standaloneNext, "static");
const publicSource = path.join(root, "public");
const publicTarget = path.join(standalone, "public");

if (!fs.existsSync(standalone)) {
  throw new Error("Missing .next/standalone. Run npm.cmd run build first.");
}

fs.mkdirSync(standaloneNext, { recursive: true });
fs.rmSync(staticTarget, { recursive: true, force: true });
fs.cpSync(staticSource, staticTarget, { recursive: true });

fs.rmSync(publicTarget, { recursive: true, force: true });
fs.cpSync(publicSource, publicTarget, { recursive: true });

for (const artifact of ["dist", ".git", ".next/cache"]) {
  fs.rmSync(path.join(standalone, artifact), { recursive: true, force: true });
}

console.log("Packaged Next standalone server assets for Electron.");
