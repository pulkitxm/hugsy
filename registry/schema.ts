import { z } from "zod";

export const componentName = z
  .string()
  .regex(/^[a-z]+(?:-[a-z]+)*$/)
  .max(80);
export const componentSchema = z.strictObject({
  name: componentName,
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["Overlay", "Feedback", "Navigation", "Layout"]),
  technique: z.string().min(1),
  filename: z.string().regex(/^Hugsy[A-Za-z]+\.swift$/),
  states: z.array(z.string()).min(1),
  interaction: z.string().min(1),
  accessibility: z.string().min(1),
  integration: z.string().min(1),
  usage: z.string().min(1),
  source: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export const registrySchema = z.strictObject({
  version: z.literal(1),
  platform: z.literal("macos"),
  minimumVersion: z.literal("14.0"),
  components: z.array(componentSchema).min(1),
});
export type Component = z.infer<typeof componentSchema>;
