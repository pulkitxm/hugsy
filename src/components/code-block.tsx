import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CodeBlock({ code, label = "Terminal" }: { code: string; label?: string }) {
  const [status, setStatus] = useState("Copy");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      setStatus("Select the code to copy");
    }
  }
  return (
    <div className="code-block">
      <div className="code-heading">
        <span>{label}</span>
        <button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()} code`}>
          {status === "Copied" ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{status}</span>
        </button>
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code requires keyboard access. */}
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
