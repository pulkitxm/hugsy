import { z } from "zod";

export const nativeSessionSchema = z.object({
  component: z.string(),
  model: z.string(),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
});

const frameSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

const nodeSchema = z.object({
  AXLabel: z.string().nullable().optional(),
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
    const x = Math.max(0, node.frame.x - root.frame.x);
    const y = Math.max(0, node.frame.y - root.frame.y);
    const width = Math.min(node.frame.width, root.frame.width - x);
    const height = Math.min(node.frame.height, 44, root.frame.height - y);
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

export function nativeTouch(type: 0 | 1 | 2, x: number, y: number, sequence: number) {
  const buffer = new ArrayBuffer(13);
  const view = new DataView(buffer);
  view.setUint8(0, 0x10);
  view.setUint8(1, type);
  view.setFloat32(2, Math.min(1, Math.max(0, x)), true);
  view.setFloat32(6, Math.min(1, Math.max(0, y)), true);
  view.setUint16(10, sequence & 0xffff, true);
  view.setUint8(12, 0);
  return buffer;
}

export function isLocalPreviewRequest(host: string | undefined, origin: string | undefined) {
  return (
    host !== undefined &&
    /^(?:127\.0\.0\.1|localhost):\d+$/.test(host) &&
    (origin === undefined || origin === `http://${host}`)
  );
}
