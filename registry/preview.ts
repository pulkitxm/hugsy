import { z } from "zod";

const identifier = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/)
  .max(80);

export const previewStepSchema = z.strictObject({
  screen: identifier,
  state: identifier,
  durationMilliseconds: z.number().int().min(100).max(10000),
});

const previewScreenSchema = z.strictObject({
  id: identifier,
  label: z.string().min(1),
  asset: identifier,
  initialState: identifier,
  states: z.array(identifier).min(1),
  timeline: z.array(previewStepSchema).min(1),
});

export const previewDefinitionSchema = z
  .strictObject({
    headline: z.string().min(1),
    initialScreen: identifier,
    screens: z.array(previewScreenSchema).min(1),
  })
  .superRefine((definition, context) => {
    const screens = new Map(definition.screens.map((screen) => [screen.id, screen]));
    if (screens.size !== definition.screens.length || !screens.has(definition.initialScreen)) {
      context.addIssue({
        code: "custom",
        message: "Screen IDs must be unique and include the initial screen.",
      });
    }
    if (
      new Set(definition.screens.map((screen) => screen.asset)).size !== definition.screens.length
    ) {
      context.addIssue({ code: "custom", message: "Each preview screen needs a unique asset." });
    }
    for (const screen of definition.screens) {
      if (
        new Set(screen.states).size !== screen.states.length ||
        !screen.states.includes(screen.initialState)
      ) {
        context.addIssue({
          code: "custom",
          message: `Invalid initial state or duplicate states: ${screen.id}`,
        });
      }
      if (
        screen.timeline.reduce((duration, step) => duration + step.durationMilliseconds, 0) > 30000
      ) {
        context.addIssue({
          code: "custom",
          message: `Preview flow exceeds 30 seconds: ${screen.id}`,
        });
      }
      for (const step of screen.timeline) {
        if (!screens.get(step.screen)?.states.includes(step.state)) {
          context.addIssue({
            code: "custom",
            message: `Unknown preview screen or state: ${step.screen}/${step.state}`,
          });
        }
      }
    }
  });

export type PreviewDefinition = z.infer<typeof previewDefinitionSchema>;
export type PreviewScreen = z.infer<typeof previewScreenSchema>;

export function previewScreen(definition: PreviewDefinition, id = definition.initialScreen) {
  const screen = definition.screens.find((screen) => screen.id === id);
  if (!screen) {
    throw new Error(`Unknown preview screen: ${id}`);
  }
  return screen;
}

export function previewDuration(screen: PreviewScreen) {
  return screen.timeline.reduce((duration, step) => duration + step.durationMilliseconds, 0);
}
