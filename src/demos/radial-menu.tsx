import { type KeyboardEvent, useState } from "react";
import { Camera, LinkIcon, Plus, SquarePen } from "../components/icons";
import type { CSSVariables } from "./shared";

const actions = [
  { id: "photo", title: "Add photo", Icon: Camera },
  { id: "note", title: "New note", Icon: SquarePen },
  { id: "link", title: "Save link", Icon: LinkIcon },
];
const radius = 100;

const notes = [
  { title: "Weekend plans", detail: "Market, long walk, call home" },
  { title: "Reading list", detail: "Three essays saved for later" },
  { title: "Ideas", detail: "A softer onboarding flow" },
];

export default function RadialMenu() {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState(notes);

  function choose(title: string) {
    setExpanded(false);
    setEntries((current) => [
      { title, detail: "Just now" },
      ...current.filter((entry) => entry.detail !== "Just now"),
    ]);
  }

  function closeOnEscape(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setExpanded(false);
    }
  }

  return (
    <div className="demo radial-demo" data-expanded={expanded}>
      <p className="demo-title">Notes</p>
      <ul className="radial-notes">
        {entries.map((entry) => (
          <li key={`${entry.title}-${entry.detail}`} data-fresh={entry.detail === "Just now"}>
            <strong>{entry.title}</strong>
            <small>{entry.detail}</small>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="radial-backdrop"
        aria-label="Close actions"
        tabIndex={-1}
        inert={!expanded}
        onClick={() => setExpanded(false)}
      />
      <div className="radial-menu">
        {actions.map(({ id, title, Icon }, index) => {
          const angle = (index / (actions.length - 1)) * Math.PI - Math.PI / 2;
          const style: CSSVariables = {
            "--x": Math.sin(angle) * radius,
            "--y": -Math.cos(angle) * radius - 18,
            "--delay": `${expanded ? index * 35 : 0}ms`,
          };
          return (
            <button
              type="button"
              key={id}
              className="radial-action"
              style={style}
              aria-label={title}
              inert={!expanded}
              onKeyDown={closeOnEscape}
              onClick={() => choose(title)}
            >
              <Icon aria-hidden="true" />
            </button>
          );
        })}
        <button
          type="button"
          className="radial-trigger"
          aria-label={expanded ? "Close actions" : "Open actions"}
          aria-expanded={expanded}
          onKeyDown={closeOnEscape}
          onClick={() => setExpanded(!expanded)}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
