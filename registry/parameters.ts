type Parameter = { name: string; type: string; defaultValue: string; description: string };

export const componentParameters: Record<string, Parameter[]> = {
  "expanding-cards": [
    {
      name: "items",
      type: "[Item: Identifiable]",
      defaultValue: "Required",
      description: "Your models, with stable and unique IDs.",
    },
    {
      name: "selection",
      type: "Binding<Item.ID?>",
      defaultValue: "Required",
      description: "The open card ID. Set nil to close it programmatically.",
    },
    {
      name: "cardHeight",
      type: "CGFloat",
      defaultValue: "180",
      description: "Collapsed height, clamped to at least 44 points.",
    },
    {
      name: "expandedHeight",
      type: "CGFloat",
      defaultValue: "440",
      description: "Open height, clamped to at least the card height.",
    },
    {
      name: "content",
      type: "(Item, Bool) -> Content",
      defaultValue: "Required",
      description: "A view builder receiving the model and expanded state.",
    },
  ],
  "morphing-sheet": [
    {
      name: "position",
      type: "Binding<HugsySheetPosition>",
      defaultValue: "Required",
      description: "Either .compact or .expanded. Drives the inline surface.",
    },
    {
      name: "compactHeight",
      type: "CGFloat",
      defaultValue: "200",
      description: "Collapsed height, clamped to at least 100 points.",
    },
    {
      name: "expandedHeight",
      type: "CGFloat",
      defaultValue: "430",
      description: "Expanded height, at least 44 points above the compact height.",
    },
    {
      name: "content",
      type: "(HugsySheetPosition) -> Content",
      defaultValue: "Required",
      description: "Content that adapts to the current position.",
    },
  ],
  "radial-menu": [
    {
      name: "actions",
      type: "[HugsyRadialAction]",
      defaultValue: "Required",
      description: "Stable IDs, labels, SF Symbols, and main-actor closures.",
    },
    {
      name: "isExpanded",
      type: "Binding<Bool>",
      defaultValue: "Required",
      description: "Controls the action arc. Selection closes it before running an action.",
    },
    {
      name: "radius",
      type: "CGFloat",
      defaultValue: "100",
      description: "Arc radius in points, clamped to at least 70. Reserve sufficient layout space.",
    },
  ],
  "toast-stack": [
    {
      name: "toasts",
      type: "HugsyToasts",
      defaultValue: "Required",
      description: "Keep this main-actor observable model in @State.",
    },
    {
      name: "show(_:symbol:duration:)",
      type: "HugsyToasts method",
      defaultValue: "5 seconds",
      description:
        "Adds a toast at the front, keeping at most four. The symbol defaults to checkmark.circle.fill.",
    },
    {
      name: "dismiss(_:)",
      type: "(UUID) -> Void",
      defaultValue: "None",
      description: "Removes the matching notification. Repeated dismissal is safe.",
    },
  ],
  "fluid-tabs": [
    {
      name: "tabs",
      type: "[String]",
      defaultValue: "Required",
      description: "Display labels. Duplicates are removed while preserving order.",
    },
    {
      name: "selection",
      type: "Binding<String>",
      defaultValue: "Required",
      description:
        "Selected label. Invalid selections reset to the first available tab when labels change.",
    },
  ],
  "stretchy-header": [
    {
      name: "height",
      type: "CGFloat",
      defaultValue: "320",
      description: "Resting header height in points, clamped to at least 44.",
    },
    {
      name: "header",
      type: "() -> Header",
      defaultValue: "Required",
      description: "The edge-to-edge header view. It is clipped to expanding bounds.",
    },
    {
      name: "content",
      type: "() -> Content",
      defaultValue: "Required",
      description:
        "The body of the native ScrollView. Avoid wrapping it in another vertical ScrollView.",
    },
  ],
};
