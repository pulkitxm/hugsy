import { execFileSync } from "node:child_process";
import { chmod, copyFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { z } from "zod";
import manifest from "../package.json";

await build({
  entryPoints: ["cli/index.ts"],
  outfile: "dist/cli/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  minify: true,
  legalComments: "none",
  banner: { js: "#!/usr/bin/env node" },
});
await chmod("dist/cli/index.js", 0o755);
await writeFile(
  "dist/cli/package.json",
  `${JSON.stringify({
    name: manifest.name,
    version: manifest.version,
    type: "module",
    description: manifest.description,
    license: manifest.license,
    repository: manifest.repository,
    engines: manifest.engines,
    bin: { hugsy: "index.js" },
    files: ["index.js", "LICENSE", "README.md"],
  })}\n`,
);
await Promise.all(["LICENSE", "README.md"].map((file) => copyFile(file, `dist/cli/${file}`)));
const packed = z
  .array(z.object({ filename: z.string() }))
  .parse(
    JSON.parse(
      execFileSync("npm", ["pack", "./dist/cli", "--pack-destination", "generated", "--json"], {
        encoding: "utf8",
      }),
    ),
  );
const artifact = packed[0];
if (!artifact) {
  throw new Error("CLI package was not produced");
}
await copyFile(`generated/${artifact.filename}`, `public/hugsy-${manifest.version}.tgz`);
