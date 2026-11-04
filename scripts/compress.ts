import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

async function compress(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await compress(path);
    } else if (/\.(?:html|js|css|svg|json|txt|vtt|swift)$/.test(entry.name)) {
      const content = await readFile(path);
      if (content.byteLength < 1000) {
        continue;
      }
      await Promise.all([
        writeFile(`${path}.gz`, gzipSync(content, { level: 9 })),
        writeFile(
          `${path}.br`,
          brotliCompressSync(content, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }),
        ),
      ]);
    }
  }
}
await compress("dist/client");
