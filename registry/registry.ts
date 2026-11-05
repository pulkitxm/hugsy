import data from "../generated/site-registry.json";
import { websiteRegistrySchema } from "./schema";

export const registry = websiteRegistrySchema.parse(data);
