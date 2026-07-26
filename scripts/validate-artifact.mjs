import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL, fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workerPath = path.join(projectRoot, "dist", "server", "index.js");
const hostingPath = path.join(projectRoot, "dist", ".openai", "hosting.json");

try {
  JSON.parse(await readFile(hostingPath, "utf8"));
} catch (error) {
  throw new Error(`Invalid or missing Sites manifest: ${hostingPath}`, {
    cause: error,
  });
}

const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("sites-validation", `${process.pid}-${Date.now()}`);

let worker;
try {
  worker = await import(workerUrl.href);
} catch (error) {
  throw new Error(`Invalid or missing Sites Worker entry: ${workerPath}`, {
    cause: error,
  });
}

if (!worker.default || typeof worker.default.fetch !== "function") {
  throw new Error(
    "dist/server/index.js must have an ESM default export with fetch(request, env, ctx)",
  );
}

console.log(
  "Validated Sites artifact: ESM Worker default.fetch and hosting manifest are present.",
);
