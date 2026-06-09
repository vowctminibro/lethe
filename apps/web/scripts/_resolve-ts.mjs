import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !path.extname(specifier) && context.parentURL?.startsWith("file:")) {
    const dir = path.dirname(fileURLToPath(context.parentURL));
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const cand = path.resolve(dir, specifier + ext);
      if (existsSync(cand)) return next(pathToFileURL(cand).href, context);
    }
  }
  return next(specifier, context);
}
