const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(context) {
  const root = context.packager.projectDir;
  const appServer = path.join(context.appOutDir, "resources", "app-server");
  const sourceNodeModules = path.join(root, ".next", "standalone", "node_modules");
  const targetNodeModules = path.join(appServer, "node_modules");

  if (!fs.existsSync(sourceNodeModules)) {
    throw new Error(`Missing standalone node_modules at ${sourceNodeModules}`);
  }

  fs.rmSync(targetNodeModules, { recursive: true, force: true });
  fs.cpSync(sourceNodeModules, targetNodeModules, { recursive: true });
  console.log("Copied standalone node_modules into packaged app resources.");
};
