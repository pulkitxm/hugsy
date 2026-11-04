import data from "../generated/registry.json";
import { registrySchema } from "../registry/schema";

export const registry = registrySchema.parse(data);

export function getComponent(name: string) {
  const component = registry.components.find((item) => item.name === name);
  if (!component) {
    throw new Error(`Unknown component: ${name}. Run hugsy list to see available components.`);
  }
  return component;
}

export function searchComponents(query = "") {
  const terms = query.toLowerCase().trim().split(/\s+/);
  return registry.components.filter((item) =>
    terms.every((term) =>
      `${item.name} ${item.description} ${item.category} ${item.technique}`
        .toLowerCase()
        .includes(term),
    ),
  );
}
