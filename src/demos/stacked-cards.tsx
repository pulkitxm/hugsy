import { type PointerEvent, useRef, useState } from "react";
import { Artwork, type CSSVariables, stories, useReducedMotion } from "./shared";

const visibleCount = 3;
const commit = 90;

export default function StackedCards() {
  const [cards, setCards] = useState(stories.slice(0, 3));
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; y: number; id: string } | null>(null);
  const leaving = useRef(false);
  const reduced = useReducedMotion();

  function apply(dy: number, rotation: number, mode: "drag" | "release" | "idle") {
    const element = root.current;
    if (!element) {
      return;
    }
    element.dataset["mode"] = mode;
    element.style.setProperty("--dy", `${dy}px`);
    element.style.setProperty("--rotation", `${rotation}deg`);
  }

  function finish(id: string) {
    setCards((current) => {
      const index = current.findIndex((card) => card.id === id);
      if (index < 0) {
        return current;
      }
      return [...current.slice(index + 1), ...current.slice(0, index + 1)];
    });
    apply(0, 0, "release");
    requestAnimationFrame(() => {
      leaving.current = false;
    });
  }

  function cycle(id: string) {
    const card = cards.find((item) => item.id === id);
    if (!card || leaving.current) {
      return;
    }
    leaving.current = true;
    setAnnouncement(`Sent ${card.title} to the back`);
    finish(id);
  }

  function begin(event: PointerEvent<HTMLDivElement>, id: string) {
    if (leaving.current || drag.current || event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset["dragging"] = "";
    drag.current = { pointer: event.pointerId, y: event.clientY, id };
    apply(0, 0, "drag");
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    apply(event.clientY - current.y, reduced ? 0 : (event.clientY - current.y) / 24, "drag");
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    drag.current = null;
    delete event.currentTarget.dataset["dragging"];
    const dy = event.clientY - current.y;
    if (Math.abs(dy) > commit) {
      cycle(current.id);
    } else {
      apply(0, 0, "release");
    }
  }

  return (
    <div className="demo stacked-demo" ref={root} data-mode="idle">
      <p className="demo-title">Up next</p>
      <div className="stacked-stage">
        {cards.slice(0, visibleCount).map((card, index) => {
          const style: CSSVariables = { "--index": index, zIndex: visibleCount - index };
          const front = index === 0;
          return (
            <div
              key={card.id}
              className="stacked-card"
              style={style}
              data-id={card.id}
              data-top={front ? "" : undefined}
              aria-hidden={!front}
              onPointerDown={front ? (event) => begin(event, card.id) : undefined}
              onPointerMove={front ? move : undefined}
              onPointerUp={front ? end : undefined}
              onPointerCancel={front ? end : undefined}
            >
              <Artwork hue={card.hue} />
              <span className="card-caption">
                <small>{card.subtitle}</small>
                <strong>{card.title}</strong>
              </span>
            </div>
          );
        })}
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
