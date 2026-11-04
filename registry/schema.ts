import { z } from "zod";
import { previewDefinitionSchema } from "./preview.ts";

const componentName = z
  .string()
  .regex(/^[a-z]+(?:-[a-z]+)*$/)
  .max(80);
const fileMetadataSchema = z.strictObject({
  path: z
    .string()
    .max(240)
    .regex(/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?:\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)*$/),
  kind: z.enum(["source", "resource"]),
});
export const componentMetadataSchema = z.strictObject({
  name: componentName,
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum([
    "Overlay",
    "Feedback",
    "Navigation",
    "Gestures",
    "Scroll",
    "Infrastructure",
    "Media",
    "Graphics",
    "System",
  ]),
  technique: z.string().min(1),
  filename: z.string().regex(/^Hugsy[A-Za-z]+\.swift$/),
  frameworks: z.array(z.string().regex(/^[A-Z][A-Za-z0-9]*$/)).min(1),
  dependencies: z.array(componentName),
  files: z.array(fileMetadataSchema).min(1),
  states: z.array(z.string()).min(1),
  interaction: z.string().min(1),
  accessibility: z.string().min(1),
  integration: z.string().min(1),
  usage: z.string().min(1),
  preview: previewDefinitionSchema,
});
export const componentSchema = componentMetadataSchema.extend({
  files: z
    .array(
      fileMetadataSchema.extend({
        data: z.base64(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .min(1),
  source: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const registryHeaderSchema = z.strictObject({
  version: z.literal(2),
  platform: z.literal("ios"),
  minimumVersion: z.literal("17.0"),
});
export const websiteRegistrySchema = registryHeaderSchema.extend({
  components: z
    .array(
      componentMetadataSchema.extend({
        source: z.string().min(1),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .min(1),
});
export const registrySchema = registryHeaderSchema
  .extend({
    components: z.array(componentSchema).min(1),
  })
  .superRefine((registry, context) => {
    const entries = new Map(registry.components.map((item) => [item.name, item]));
    const fail = (message: string) => context.addIssue({ code: "custom", message });
    if (entries.size !== registry.components.length) {
      fail("Duplicate component names");
    }
    for (const item of registry.components) {
      if (!item.files.some((file) => file.path === item.filename && file.kind === "source")) {
        fail(`Missing entrypoint: ${item.name}`);
      }
      if (new Set(item.files.map((file) => file.path.toLowerCase())).size !== item.files.length) {
        fail(`Duplicate file paths: ${item.name}`);
      }
      if (new Set(item.dependencies).size !== item.dependencies.length) {
        fail(`Duplicate dependencies: ${item.name}`);
      }
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (name: string) => {
      if (visited.has(name)) {
        return;
      }
      if (visiting.has(name)) {
        fail(`Dependency cycle: ${name}`);
        return;
      }
      const item = entries.get(name);
      if (!item) {
        fail(`Unknown dependency: ${name}`);
        return;
      }
      visiting.add(name);
      for (const dependency of item.dependencies) {
        visit(dependency);
      }
      visiting.delete(name);
      visited.add(name);
    };
    for (const name of entries.keys()) {
      visit(name);
    }
  });
