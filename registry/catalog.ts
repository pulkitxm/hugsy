import entries from "./catalog.json" with { type: "json" };
import { componentMetadataSchema } from "./schema.ts";

export const catalog = componentMetadataSchema.array().parse(entries);
export const showcase = catalog.filter((item) => item.category !== "Infrastructure");
