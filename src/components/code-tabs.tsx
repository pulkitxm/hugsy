import { useEffect, useState } from "react";
import { CodeBlock } from "./code-block";

export function CodeTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { name: string; code: string }[];
}) {
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const tab = tabs[selected] ?? tabs[0];
  if (!tab) {
    return null;
  }
  return (
    <div className="code-tabs">
      {tabs.length > 1 && (
        <fieldset className="segmented" disabled={!ready}>
          <legend className="sr-only">{label}</legend>
          {tabs.map((item, index) => (
            <button
              type="button"
              key={item.name}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              {item.name}
            </button>
          ))}
        </fieldset>
      )}
      <CodeBlock code={tab.code} label={tab.name} />
    </div>
  );
}
