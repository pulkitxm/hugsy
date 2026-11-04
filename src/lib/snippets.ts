export const installCommand = "curl -fsSL https://hugsy.pulkit.page/install.sh | sh";
export const firstComponent =
  "cd YourApp\nhugsy init --directory YourApp/Components/Hugsy\nhugsy add expanding-cards --dry-run\nhugsy add expanding-cards";
export const packageConfig = '{\n  "version": 1,\n  "directory": "YourApp/Components/Hugsy"\n}';
export const mcpConfig =
  '{\n  "mcpServers": {\n    "hugsy": {\n      "command": "hugsy",\n      "args": ["mcp"]\n    }\n  }\n}';
export const manualInstall =
  'git clone https://github.com/pulkitxm/hugsy.git\ncd hugsy\nswift build -c release --product hugsy\nmkdir -p "$HOME/.local/bin"\ninstall -m 755 .build/release/hugsy "$HOME/.local/bin/hugsy"';
export const sourceExample =
  "@State private var selected: Story.ID?\n\nHugsyExpandingCards(\n  items: stories,\n  selection: $selected\n) { story, expanded in\n  StoryCard(story, expanded: expanded)\n}";
