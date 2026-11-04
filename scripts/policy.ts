import { parse } from "@babel/parser";

export function checkPolicy(path: string, content: string) {
  const errors: string[] = [];
  if (content.includes(String.fromCodePoint(0x2014))) {
    errors.push("Forbidden punctuation");
  }
  if (content.length > 0 && !content.endsWith("\n")) {
    errors.push("Missing final newline");
  }
  if (content.includes("\r")) {
    errors.push("Expected LF line endings");
  }
  if (Buffer.byteLength(content) > 512000) {
    errors.push("File exceeds 500 KB");
  }
  if (/\.(?:tsx?|m?js)$/.test(path)) {
    const ast = parse(content, {
      sourceType: "module",
      plugins: path.endsWith(".tsx") ? ["typescript", "jsx"] : ["typescript"],
    });
    for (const comment of ast.comments ?? []) {
      if (!/^biome-ignore lint\/[\w/]+:/.test(comment.value.trim())) {
        errors.push("Prose code comment");
      }
    }
    function visit(value: unknown) {
      if (!value || typeof value !== "object") {
        return;
      }
      if (
        "type" in value &&
        typeof value.type === "string" &&
        ["TSAsExpression", "TSTypeAssertion", "TSNonNullExpression", "TSAnyKeyword"].includes(
          value.type,
        )
      ) {
        errors.push(`Unsafe type escape: ${value.type}`);
      }
      for (const child of Object.values(value)) {
        if (Array.isArray(child)) {
          for (const entry of child) {
            visit(entry);
          }
        } else {
          visit(child);
        }
      }
    }
    visit(ast.program);
  }
  if (/\.(?:swift|css|html|svg|ya?ml)$/.test(path)) {
    const stripped = content
      .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gs, "")
      .replace(/^\/\/ swift-tools-version: [\d.]+\s*$/gm, "");
    if (/\/\*|\/\/|<!--|^\s*#\s/m.test(stripped)) {
      errors.push("Prose code comment");
    }
  }
  return errors;
}
