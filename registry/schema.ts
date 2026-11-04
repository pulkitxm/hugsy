import { z } from "zod";

const componentName = z
  .string()
  .regex(/^[a-z]+(?:-[a-z]+)*$/)
  .max(80);
export const fileMetadataSchema = z.strictObject({
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
export const registrySchema = z.strictObject({
  version: z.literal(2),
  platform: z.literal("ios"),
  minimumVersion: z.literal("17.0"),
  components: z.array(componentSchema).min(1),
});
