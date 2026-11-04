import { describe, expect, it } from "vitest";
import {
  isLocalPreviewRequest,
  nativeActions,
  nativeSessionSchema,
  nativeTouch,
} from "../src/lib/native-preview";

describe("native preview transport", () => {
  it("preserves the native framebuffer dimensions", () => {
    expect(
      nativeSessionSchema.parse({
        component: "expanding-cards",
        model: "iPhone 17 Pro",
        width: 1206,
        height: 2622,
      }),
    ).toMatchObject({ width: 1206, height: 2622 });
    expect(() =>
      nativeSessionSchema.parse({ component: "cards", model: "iPhone", width: 0, height: 0 }),
    ).toThrow();
  });

  it("encodes native touch input with clamped coordinates and wrapped sequence numbers", () => {
    const data = new DataView(nativeTouch(1, -0.2, 1.2, 65537));
    expect(data.byteLength).toBe(13);
    expect(data.getUint8(0)).toBe(0x10);
    expect(data.getUint8(1)).toBe(1);
    expect(data.getFloat32(2, true)).toBe(0);
    expect(data.getFloat32(6, true)).toBe(1);
    expect(data.getUint16(10, true)).toBe(1);
    expect(data.getUint8(12)).toBe(0);
  });

  it("retains subpixel precision when forwarding a native gesture", () => {
    const data = new DataView(nativeTouch(2, 0.25, 0.75, 4));
    expect(data.getFloat32(2, true)).toBe(0.25);
    expect(data.getFloat32(6, true)).toBe(0.75);
    expect(data.getUint8(1)).toBe(2);
  });

  it("exposes keyboard alternatives from native buttons without inventing controls", () => {
    const actions = nativeActions([
      {
        frame: { x: 0, y: 0, width: 402, height: 874 },
        children: [
          {
            type: "Button",
            AXLabel: "Open\ncard",
            frame: { x: 24, y: 230, width: 700, height: 400 },
          },
          {
            type: "Button",
            AXLabel: "Hidden",
            frame: { x: 450, y: 20, width: 44, height: 44 },
          },
          {
            type: "Button",
            AXLabel: "Disabled",
            enabled: false,
            frame: { x: 20, y: 20, width: 44, height: 44 },
          },
          { type: "StaticText", frame: { x: 20, y: 20, width: 44, height: 44 } },
          { type: "Button", AXLabel: "Invalid", frame: { x: 0, y: 0, width: 0, height: 0 } },
        ],
      },
    ]);
    expect(actions).toEqual([
      {
        id: "0.0",
        label: "Open card",
        x: 24 / 402,
        y: 230 / 874,
        width: 378 / 402,
        height: 44 / 874,
      },
    ]);
  });

  it("rejects remote, rebinding, and cross-origin requests", () => {
    expect(isLocalPreviewRequest("127.0.0.1:3000", "http://127.0.0.1:3000")).toBe(true);
    expect(isLocalPreviewRequest("localhost:3000", undefined)).toBe(true);
    expect(isLocalPreviewRequest("127.0.0.1:3000", "https://example.com")).toBe(false);
    expect(isLocalPreviewRequest("example.com:3000", "http://example.com:3000")).toBe(false);
    expect(isLocalPreviewRequest(undefined, undefined)).toBe(false);
  });
});
