import { z } from "zod";

export const nativeSessionSchema = z.object({
  component: z.string(),
  model: z.string(),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
});

export type NativeSession = z.infer<typeof nativeSessionSchema>;

const frameSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

const nodeSchema = z.object({
  AXLabel: z.string().nullable().optional(),
  AXUniqueId: z.string().nullable().optional(),
  type: z.string().optional(),
  enabled: z.boolean().optional(),
  frame: frameSchema,
  children: z.array(z.unknown()).optional(),
});

export const nativeActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1),
});

export type NativeAction = z.infer<typeof nativeActionSchema>;

export function nativeGalleryReady(value: unknown): boolean {
  const roots = z.array(z.unknown()).safeParse(value);
  if (!roots.success) {
    return false;
  }
  function ready(value: unknown): boolean {
    const node = nodeSchema.safeParse(value);
    return (
      node.success &&
      (node.data.AXUniqueId === "hugsy-gallery-ready" || node.data.children?.some(ready) === true)
    );
  }
  return roots.data.some(ready);
}

export function nativeActions(value: unknown): NativeAction[] {
  const roots = z.array(z.unknown()).parse(value);
  const root = nodeSchema.parse(roots[0]);
  const result: NativeAction[] = [];
  function visit(value: unknown, path: string) {
    const parsed = nodeSchema.safeParse(value);
    if (!parsed.success) {
      return;
    }
    const node = parsed.data;
    const left = Math.max(root.frame.x, node.frame.x);
    const top = Math.max(root.frame.y, node.frame.y);
    const right = Math.min(root.frame.x + root.frame.width, node.frame.x + node.frame.width);
    const bottom = Math.min(root.frame.y + root.frame.height, node.frame.y + node.frame.height);
    const x = left - root.frame.x;
    const y = top - root.frame.y;
    const width = right - left;
    const height = Math.min(44, bottom - top);
    if (
      node.type === "Button" &&
      node.enabled !== false &&
      node.AXLabel &&
      width > 0 &&
      height > 0
    ) {
      result.push({
        id: path,
        label: node.AXLabel.replace(/\s+/g, " "),
        x: x / root.frame.width,
        y: y / root.frame.height,
        width: width / root.frame.width,
        height: height / root.frame.height,
      });
    }
    node.children?.forEach((child, index) => {
      visit(child, `${path}.${index}`);
    });
  }
  roots.forEach((node, index) => {
    visit(node, String(index));
  });
  return result;
}

export function nativeTouch(type: 0 | 1 | 2, x: number, y: number) {
  const names = { 0: "begin", 1: "move", 2: "end" };
  const payload = new TextEncoder().encode(
    JSON.stringify({
      type: names[type],
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
      edge: 0,
    }),
  );
  const packet = new Uint8Array(payload.length + 1);
  packet[0] = 0x03;
  packet.set(payload, 1);
  return packet;
}

export function isLocalPreviewRequest(host: string | undefined, origin: string | undefined) {
  return (
    host !== undefined &&
    /^(?:127\.0\.0\.1|localhost):\d+$/.test(host) &&
    (origin === undefined || origin === `http://${host}`)
  );
}
