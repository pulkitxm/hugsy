export const catalog = [
  {
    name: "command-palette",
    title: "Command palette",
    description:
      "A keyboard-first command surface with a spring-driven selection, live filtering, and native sheet presentation.",
    category: "Overlay",
    technique: "Matched geometry",
    filename: "HugsyCommandPalette.swift",
    states: ["Closed", "Searching", "Selected", "No results", "Dismissed"],
    interaction:
      "Open the palette. Type to filter, use arrow keys to navigate, and Return to run a command. Escape closes it.",
    accessibility:
      "Present in a native .sheet. Search receives initial focus. Commands are native buttons with selected traits. Reduce Motion disables the moving highlight.",
    integration:
      "Own the sheet binding in your app. Supply stable, unique command IDs and main-actor actions. The palette dismisses before running an action. Filtering is local and synchronous.",
    usage:
      'HugsyCommandPalette(commands: [\n    .init(id: "new", title: "New project", symbol: "plus") { createProject() }\n]) { isPresented = false }',
  },
  {
    name: "toast-stack",
    title: "Toast stack",
    description:
      "Notifications that spring into place, reflow on dismissal, and clean up their own lifetime tasks.",
    category: "Feedback",
    technique: "Spring reflow",
    filename: "HugsyToastStack.swift",
    states: ["Empty", "Entering", "Stacked", "Dismissing", "Expired"],
    interaction:
      "Add a notification, stack a few more, then dismiss one. Each notification expires independently.",
    accessibility:
      "Each notification includes a labeled dismiss button. Reduced Motion uses opacity rather than sliding transitions. Do not use toasts as the only record of a critical error.",
    integration:
      "Keep a HugsyToasts instance in @State. Overlay HugsyToastStack at your window edge. At most four notifications remain visible. Removing a row cancels its lifetime task.",
    usage:
      '@State private var toasts = HugsyToasts()\n\nHugsyToastStack(toasts: toasts)\n\nButton("Save") { toasts.show("Changes saved") }',
  },
  {
    name: "fluid-tabs",
    title: "Fluid tabs",
    description:
      "A shared selection pill that stretches and settles between variable-width tabs without layout jumps.",
    category: "Navigation",
    technique: "Shared geometry",
    filename: "HugsyFluidTabs.swift",
    states: ["Selected", "Transitioning", "Overflow", "Empty"],
    interaction:
      "Switch between tabs to feel the shared pill follow your selection. The content changes with it.",
    accessibility:
      "Native buttons expose the selected trait. Labels remain visible, horizontally scroll when necessary, and the pill does not animate with Reduce Motion.",
    integration:
      "Supply unique display labels and a selection binding. Render your own content below the tab strip. An invalid selection resets to the first label when the labels change.",
    usage:
      '@State private var tab = "Overview"\n\nHugsyFluidTabs(\n    tabs: ["Overview", "Activity", "Settings"],\n    selection: $tab\n)',
  },
  {
    name: "magnifying-dock",
    title: "Magnifying dock",
    description:
      "A proximity-aware app dock with neighbor magnification, bottom-anchored springs, and keyboard focus parity.",
    category: "Navigation",
    technique: "Proximity springs",
    filename: "HugsyMagnifyingDock.swift",
    states: ["Resting", "Hovered", "Neighbor", "Focused", "Activated"],
    interaction:
      "Move across the dock or Tab through its buttons. Nearby icons respond. Click an app to activate it.",
    accessibility:
      "Every icon has a text label and tooltip. Keyboard focus magnifies just like hover. Reduce Motion keeps all icons at their resting size. Respect the system keyboard-navigation setting.",
    integration:
      "Supply stable, unique item IDs, SF Symbols, colors, and actions. Place the dock in a sufficiently wide container. This component does not launch applications by itself.",
    usage:
      'HugsyMagnifyingDock(items: [\n    .init(id: "files", title: "Files", symbol: "folder.fill", color: .blue) { openFiles() },\n    .init(id: "music", title: "Music", symbol: "music.note", color: .pink) { openMusic() }\n])',
  },
  {
    name: "card-stack",
    title: "Card stack",
    description:
      "A layered deck with interactive drag tilt, depth scaling, and interruptible spring settling.",
    category: "Layout",
    technique: "Gesture-driven spring",
    filename: "HugsyCardStack.swift",
    states: ["Stacked", "Dragging", "Settling", "Advanced", "Empty"],
    interaction:
      "Drag the front card sideways or use Next card. The deck cycles, and the layers settle into their new positions.",
    accessibility:
      "A Next card button is an alternative to dragging. Only the front card is exposed to accessibility. Reduce Motion removes tilt, scaling, and spring settling.",
    integration:
      "Pass Identifiable items with stable, unique IDs and a content builder. Keep card heights consistent. The deck displays up to three layers and resets when item IDs change.",
    usage:
      "HugsyCardStack(items: projects) { project in\n    Text(project.title)\n        .frame(height: 180)\n        .frame(maxWidth: .infinity)\n        .background(.blue.gradient, in: RoundedRectangle(cornerRadius: 20))\n}",
  },
  {
    name: "animated-sidebar",
    title: "Animated sidebar",
    description:
      "A collapsing desktop sidebar with coordinated label transitions and a traveling selection background.",
    category: "Navigation",
    technique: "Coordinated layout",
    filename: "HugsyAnimatedSidebar.swift",
    states: ["Expanded", "Collapsed", "Selected", "Transitioning", "Empty"],
    interaction:
      "Choose a destination, then collapse the sidebar. The active item stays visible as the layout contracts.",
    accessibility:
      "Icon-only mode preserves text labels and tooltips. Selection is announced with the selected trait. Expand and collapse controls have distinct labels. Reduce Motion disables layout animation.",
    integration:
      "Bind selection to your own destination state. Supply unique IDs. The sidebar owns its expanded state and adjusts its width. It does not replace NavigationSplitView routing.",
    usage:
      '@State private var destination = "inbox"\n\nHugsyAnimatedSidebar(title: "Workspace", items: [\n    .init(id: "inbox", title: "Inbox", symbol: "tray"),\n    .init(id: "projects", title: "Projects", symbol: "square.stack")\n], selection: $destination)',
  },
];
