export const installCommand = "curl -fsSL https://hugsy.pulkit.page/install.sh | sh";
export const firstComponent =
  "cd YourApp\nhugsy init\nhugsy add expanding-cards --dry-run\nhugsy add expanding-cards\nhugsy doctor";
export const packageConfig =
  '{\n  "version": 2,\n  "directory": "Hugsy",\n  "distribution": "package"\n}';
export const mcpConfig =
  '{\n  "mcpServers": {\n    "hugsy": {\n      "command": "hugsy",\n      "args": ["mcp"]\n    }\n  }\n}';
export const manualInstall =
  'git clone https://github.com/pulkitxm/hugsy.git\ncd hugsy\nswift build -c release --product hugsy\nmkdir -p "$HOME/.local/bin"\ninstall -m 755 .build/release/hugsy "$HOME/.local/bin/hugsy"';
export const sourceExample =
  "@State private var selected: Story.ID?\n\nHugsyExpandingCards(\n  items: stories,\n  selection: $selected\n) { story, expanded in\n  StoryCard(story, expanded: expanded)\n}";
export const agentWorkflow =
  "hugsy list --json\nhugsy info expanding-cards --json\nhugsy add expanding-cards --dry-run --json";
export const uikitExample =
  "let cards = HugsyExpandingCardsViewController(items: stories) { story, expanded in\n  StoryView(story: story, expanded: expanded)\n}\naddChild(cards)\nview.addSubview(cards.view)\ncards.didMove(toParent: self)";
