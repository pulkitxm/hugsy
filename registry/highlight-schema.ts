import { z } from "zod";

export const highlightSchema = z.record(
  z.string(),
  z.array(
    z.object({
      start: z.number(),
      tokens: z.array(z.tuple([z.string(), z.string(), z.string(), z.number()])),
    }),
  ),
);
