type Parameter = { name: string; type: string; defaultValue: string; description: string };

export const componentParameters: Record<string, Parameter[]> = {
  "swipe-deck": [
    {
      name: "items",
      type: "Binding<[Item: Identifiable]>",
      defaultValue: "Required",
      description: "The deck, top card first. Swiped cards are removed from the binding.",
    },
    {
      name: "visibleCount",
      type: "Int",
      defaultValue: "3",
      description: "Cards drawn in the stack, clamped between 1 and 5.",
    },
    {
      name: "threshold",
      type: "CGFloat",
      defaultValue: "110",
      description:
        "Horizontal travel that commits a swipe, at least 44 points. Fast flicks commit sooner.",
    },
    {
      name: "leftLabel",
      type: "String",
      defaultValue: '"Skip"',
      description: "Label for the left button and accessibility action.",
    },
    {
      name: "rightLabel",
      type: "String",
      defaultValue: '"Like"',
      description: "Label for the right button and accessibility action.",
    },
    {
      name: "onSwipe",
      type: "(Item, HugsySwipeDirection) -> Void",
      defaultValue: "No-op",
      description: "Called after a card has left the deck.",
    },
    {
      name: "content",
      type: "(Item, Double) -> Content",
      defaultValue: "Required",
      description:
        "Card builder. The Double is drag progress from -1 to 1 for the top card, 0 for others.",
    },
  ],
  "parallax-carousel": [
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
      description: "The centered card. Set it to scroll programmatically.",
    },
    {
      name: "spacing",
      type: "CGFloat",
      defaultValue: "14",
      description: "Gap between cards in points.",
    },
    {
      name: "peek",
      type: "CGFloat",
      defaultValue: "36",
      description: "How much of each neighbor shows at the edges.",
    },
    {
      name: "parallax",
      type: "CGFloat",
      defaultValue: "48",
      description: "How far artwork drifts inside its card, clamped between 0 and 120.",
    },
    {
      name: "content",
      type: "(Item) -> Content",
      defaultValue: "Required",
      description: "Card content. It is drawn wider than the card to allow drift.",
    },
  ],
  "morphing-capsule": [
    {
      name: "phase",
      type: "Binding<HugsyCapsulePhase>",
      defaultValue: "Required",
      description: "One of .compact, .alert, or .expanded.",
    },
    {
      name: "compactSize",
      type: "CGSize",
      defaultValue: "126 × 37",
      description: "Resting pill size.",
    },
    {
      name: "alertSize",
      type: "CGSize",
      defaultValue: "300 × 58",
      description: "Wide alert size, at least the compact size.",
    },
    {
      name: "expandedSize",
      type: "CGSize",
      defaultValue: "360 × 200",
      description: "Expanded panel size, at least the alert size.",
    },
    {
      name: "content",
      type: "(HugsyCapsulePhase) -> Content",
      defaultValue: "Required",
      description: "Content for each phase, drawn on black in a dark color scheme.",
    },
  ],
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
};
