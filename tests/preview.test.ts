import { describe, expect, it } from "vitest";
import { catalog } from "../registry/catalog";
import {
  type PreviewDefinition,
  previewDefinitionSchema,
  previewDuration,
  previewScreen,
  previewStepSchema,
} from "../registry/preview";

function definition(): PreviewDefinition {
  return {
    headline: "A native flow",
    initialScreen: "list",
    screens: [
      {
        id: "list",
        label: "List",
        asset: "sample-list",
        initialState: "ready",
        states: ["ready", "empty"],
        timeline: [
          { screen: "list", state: "ready", durationMilliseconds: 1000 },
          { screen: "detail", state: "open", durationMilliseconds: 1500 },
        ],
      },
      {
        id: "detail",
        label: "Details",
        asset: "sample-detail",
        initialState: "open",
        states: ["open"],
        timeline: [{ screen: "detail", state: "open", durationMilliseconds: 1000 }],
      },
    ],
  };
}

describe("shared preview definitions", () => {
  it("resolves screens and computes capture duration from one definition", () => {
    const preview = previewDefinitionSchema.parse(definition());
    expect(previewScreen(preview).id).toBe("list");
    expect(previewScreen(preview, "detail").asset).toBe("sample-detail");
    expect(previewDuration(previewScreen(preview))).toBe(2500);
    expect(() => previewScreen(preview, "missing")).toThrow("Unknown preview screen");
  });

  it("rejects unknown destinations and states instead of silently changing screens", () => {
    const preview = definition();
    const screen = previewScreen(preview);
    screen.timeline.push({ screen: "missing", state: "ready", durationMilliseconds: 1000 });
    expect(previewDefinitionSchema.safeParse(preview).success).toBe(false);
    screen.timeline.pop();
    screen.timeline.push({ screen: "detail", state: "missing", durationMilliseconds: 1000 });
    expect(previewDefinitionSchema.safeParse(preview).success).toBe(false);
  });

  it("rejects duplicate screens, assets, states, and invalid initial selections", () => {
    const duplicate = definition();
    duplicate.screens.push(previewScreen(duplicate));
    expect(previewDefinitionSchema.safeParse(duplicate).success).toBe(false);
    const states = definition();
    previewScreen(states).states.push("ready");
    expect(previewDefinitionSchema.safeParse(states).success).toBe(false);
    const initial = definition();
    initial.initialScreen = "missing";
    expect(previewDefinitionSchema.safeParse(initial).success).toBe(false);
    const state = definition();
    previewScreen(state).initialState = "missing";
    expect(previewDefinitionSchema.safeParse(state).success).toBe(false);
  });

  it("rejects unsafe asset names and unbounded capture flows", () => {
    const asset = definition();
    previewScreen(asset).asset = "../escape";
    expect(previewDefinitionSchema.safeParse(asset).success).toBe(false);
    const duration = definition();
    previewScreen(duration).timeline = Array.from({ length: 4 }, () => ({
      screen: "list",
      state: "ready",
      durationMilliseconds: 10000,
    }));
    expect(previewDefinitionSchema.safeParse(duration).success).toBe(false);
    expect(
      previewStepSchema.safeParse({ screen: "list", state: "ready", durationMilliseconds: 0 })
        .success,
    ).toBe(false);
  });

  it("provides a native definition for every component and a real multi-screen example", () => {
    for (const component of catalog) {
      expect(previewDefinitionSchema.safeParse(component.preview).success).toBe(true);
    }
    const tabs = catalog.find((component) => component.name === "fluid-tabs");
    expect(tabs?.preview.screens.map((screen) => screen.id)).toEqual([
      "for-you",
      "following",
      "saved",
    ]);
  });
});
