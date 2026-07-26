import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} stopped by signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

let code;

if (process.platform === "win32") {
  console.log("Running Windows-compatible Vinext build...");
  code = await run(process.execPath, [
    path.join(projectRoot, "node_modules", "vinext", "dist", "cli.js"),
    "build",
  ]);

  if (code === 0) {
    code = await run(process.execPath, [
      path.join(projectRoot, "scripts", "validate-artifact.mjs"),
    ]);
  }
} else {
  // Keep the bounded, isolated Sites build unchanged on its Linux runtime.
  code = await run("bash", [
    path.join(projectRoot, "scripts", "build-verified.sh"),
  ]);
}

process.exit(code);
