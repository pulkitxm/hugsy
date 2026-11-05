import { describe, expect, it } from "vitest";
import { deferHydration } from "../scripts/defer-hydration";
import { checkPolicy } from "../scripts/policy";

describe("repository policy", () => {
  it("accepts URLs and comment-like strings, but rejects real comments", () => {
    expect(checkPolicy("source.ts", 'const url = "https://example.com";\n')).toEqual([]);
    expect(checkPolicy("source.ts", 'const text = "/* data */";\n')).toEqual([]);
    expect(checkPolicy("source.ts", "// explanation\nconst value = 1;\n")).toContain(
      "Prose code comment",
    );
    expect(checkPolicy("source.ts", "/* explanation */\n")).toContain("Prose code comment");
    expect(
      checkPolicy(
        "source.tsx",
        "{/* biome-ignore lint/a11y/noNoninteractiveTabindex: Required for scrolling. */}\n<div />;\n",
      ),
    ).toEqual([]);
  });
  it.each([
    "const value = input as string;",
    "const value = input!;",
    "let value: any;",
    "const value = <string>input;",
  ])("rejects type escape %s", (source) => {
    expect(
      checkPolicy("source.ts", `${source}\n`).some((message) =>
        message.startsWith("Unsafe type escape"),
      ),
    ).toBe(true);
  });
  it("accepts the package directive and rejects Swift prose comments", () => {
    expect(
      checkPolicy("Package.swift", "// swift-tools-version: 6.0\nimport PackageDescription\n"),
    ).toEqual([]);
    expect(checkPolicy("View.swift", "import SwiftUI\n// explanation\n")).toContain(
      "Prose code comment",
    );
    expect(checkPolicy("View.swift", 'let text = "https://example.com"\n')).toEqual([]);
  });
  it("rejects CSS, HTML, and YAML comments", () => {
    expect(checkPolicy("style.css", "/* explanation */\n")).toContain("Prose code comment");
    expect(checkPolicy("index.html", "<!-- explanation -->\n")).toContain("Prose code comment");
    expect(checkPolicy("ci.yml", "# explanation\n")).toContain("Prose code comment");
  });
  it("rejects forbidden punctuation, large files, and malformed endings", () => {
    expect(checkPolicy("text.md", `${String.fromCodePoint(0x2014)}\n`)).toContain(
      "Forbidden punctuation",
    );
    expect(checkPolicy("text.md", "missing")).toContain("Missing final newline");
    expect(checkPolicy("text.md", "windows\r\n")).toContain("Expected LF line endings");
    expect(checkPolicy("text.md", `${"x".repeat(512001)}\n`)).toContain("File exceeds 500 KB");
    expect(checkPolicy("empty", "")).toEqual([]);
  });
});

describe("deferred hydration", () => {
  it("cannot be broken out of by a hostile asset path", () => {
    const attack = "/assets/a.js?</script><img src=x onerror=alert(1)>";
    const html = `<head><link rel="modulepreload" href="${attack}"/><script type="module" src="${attack}"></script></head>`;
    const output = deferHydration(html);
    expect(output).not.toContain("</script><img");
    expect(output.match(/<\/script>/g)).toHaveLength(1);
    expect(output).toContain("\\u003C/script\\u003E");
  });
});
