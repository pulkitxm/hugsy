import data from "../generated/registry.json";
import { registrySchema } from "./schema";

export const registry = registrySchema.parse(data);
