import entries from "./catalog.json" with { type: "json" };
import { componentSchema } from "./schema.ts";

export const catalog = componentSchema.omit({ source: true, sha256: true }).array().parse(entries);
