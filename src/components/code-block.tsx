import { type CSSProperties, useState } from "react";
import { useHighlight } from "../lib/highlights";
import { Check, Copy } from "./icons";

function language(label: string) {
  if (label === "Terminal") {
    return "sh";
  }
  return label.endsWith("json") || label.includes("MCP") ? "json" : "swift";
}

export function CodeBlock({ code, label = "Terminal" }: { code: string; label?: string }) {
  const [status, setStatus] = useState("Copy");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      setStatus("Select code to copy");
    }
  }
  const lines = useHighlight(code);
  return (
    <div className="code-block">
      <div className="code-heading">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => {
            void copy();
          }}
          aria-label={`Copy ${label.toLowerCase()} code`}
        >
          {status === "Copied" ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{status}</span>
        </button>
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable source requires keyboard access. */}
      <pre tabIndex={0}>
        <code className={`language-${language(label)}`}>
          {lines
            ? lines.map((line) => (
                <span className="code-line" key={line.start}>
                  {line.tokens.map(([text, light, dark, offset]) => {
                    const colors: CSSProperties & Record<"--code-light" | "--code-dark", string> = {
                      "--code-light": light,
                      "--code-dark": dark,
                    };
                    return (
                      <span className="syntax-token" style={colors} key={offset}>
                        {text}
                      </span>
                    );
                  })}
                  {"\n"}
                </span>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}
