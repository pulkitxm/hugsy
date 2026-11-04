import entries from "./catalog.json" with { type: "json" };
import { componentMetadataSchema } from "./schema.ts";

export const catalog = componentMetadataSchema.array().parse(entries);
