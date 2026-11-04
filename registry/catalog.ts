import entries from "./catalog.json";
import { componentSchema } from "./schema";

export const catalog = componentSchema.omit({ source: true, sha256: true }).array().parse(entries);
