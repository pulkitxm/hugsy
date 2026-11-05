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
  return (
    <div className="code-tabs">
      {tabs.length > 1 && (
        <fieldset className="tabs" disabled={!ready}>
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
      {tabs.map((item, index) => (
        <div key={item.name} data-selected={index === selected}>
          <CodeBlock code={item.code} label={item.name} />
        </div>
      ))}
    </div>
  );
}
