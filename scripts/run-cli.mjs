import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const [cli, ...args] = process.argv.slice(2);
const entrypoints = {
  vite: path.join(projectRoot, "node_modules", "vite", "bin", "vite.js"),
  vinext: path.join(projectRoot, "node_modules", "vinext", "dist", "cli.js"),
};

if (!cli || !entrypoints[cli]) {
  console.error("Usage: node scripts/run-cli.mjs <vite|vinext> [...args]");
  process.exit(64);
}

const wranglerDirectory = path.join(projectRoot, ".wrangler");
await mkdir(wranglerDirectory, { recursive: true });

const child = spawn(process.execPath, [entrypoints[cli], ...args], {
  cwd: projectRoot,
  env: {
    ...process.env,
    WRANGLER_LOG_PATH:
      process.env.WRANGLER_LOG_PATH ??
      path.join(wranglerDirectory, "wrangler.log"),
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Unable to start ${cli}:`, error);
  process.exit(69);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`${cli} stopped by signal ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
