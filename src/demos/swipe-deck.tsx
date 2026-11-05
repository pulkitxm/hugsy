import { Heart, RotateCcw, X } from "lucide-react";
import { type PointerEvent, useRef, useState } from "react";
import { Artwork, type CSSVariables, stories, useReducedMotion } from "./shared";

type Direction = "left" | "right";
type Drag = {
  pointer: number;
  x: number;
  y: number;
  lastX: number;
  time: number;
  velocity: number;
};

const visibleCount = 3;
const commitFraction = 0.32;

export default function SwipeDeck() {
  const [cards, setCards] = useState(stories);
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const leaving = useRef(false);
  const reduced = useReducedMotion();

  function width() {
    return deck.current?.offsetWidth ?? 300;
  }

  function apply(dx: number, dy: number, mode: "drag" | "release" | "reset") {
    const element = root.current;
    if (!element) {
      return;
    }
    const progress = Math.max(-1, Math.min(1, dx / (width() * commitFraction)));
    element.dataset["mode"] = mode;
    element.style.setProperty("--dx", `${dx}px`);
    element.style.setProperty("--dy", `${dy}px`);
    element.style.setProperty("--rotation", `${reduced ? 0 : dx / 18}deg`);
    element.style.setProperty("--progress", `${progress}`);
    element.style.setProperty("--depth-progress", `${Math.abs(progress)}`);
  }

  function finish(card: string, direction: Direction) {
    const title = stories.find((story) => story.id === card)?.title ?? "Card";
    setAnnouncement(`${direction === "right" ? "Liked" : "Skipped"} ${title}`);
    setCards((current) => current.filter((item) => item.id !== card));
    apply(0, 0, "reset");
    requestAnimationFrame(() => {
      leaving.current = false;
      if (root.current) {
        root.current.dataset["mode"] = "release";
      }
    });
  }

  function swipe(direction: Direction, fromY = 0) {
    const top = cards[0];
    if (!top || leaving.current) {
      return;
    }
    leaving.current = true;
    if (reduced) {
      finish(top.id, direction);
      return;
    }
    const element = deck.current?.querySelector<HTMLElement>("[data-top]");
    apply((direction === "right" ? 1 : -1) * width() * 1.6, fromY + 60, "release");
    if (!element) {
      finish(top.id, direction);
      return;
    }
    element.addEventListener("transitionend", () => finish(top.id, direction), { once: true });
  }

  function begin(event: PointerEvent<HTMLDivElement>) {
    if (leaving.current || drag.current || event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      time: event.timeStamp,
      velocity: 0,
    };
    apply(0, 0, "drag");
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    const dx = event.clientX - current.x;
    const elapsed = Math.max(1, event.timeStamp - current.time);
    current.velocity = (event.clientX - current.lastX) / elapsed;
    current.lastX = event.clientX;
    current.time = event.timeStamp;
    apply(dx, event.clientY - current.y, "drag");
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    drag.current = null;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    const flick = Math.abs(current.velocity) > 0.6 && Math.sign(current.velocity) === Math.sign(dx);
    if (Math.abs(dx) > width() * commitFraction || flick) {
      swipe(dx > 0 ? "right" : "left", dy);
    } else {
      apply(0, 0, "release");
    }
  }

  return (
    <div className="demo swipe-demo" ref={root} data-mode="release">
      <p className="demo-title">For you</p>
      <div className="swipe-deck" ref={deck}>
        {cards.length === 0 && (
          <div className="swipe-empty">
            <p>You are all caught up.</p>
            <button type="button" className="demo-pill" onClick={() => setCards(stories)}>
              <RotateCcw aria-hidden="true" />
              Start over
            </button>
          </div>
        )}
        {cards.slice(0, visibleCount).map((card, index) => {
          const style: CSSVariables = { "--index": index, zIndex: visibleCount - index };
          return (
            <div
              key={card.id}
              className="swipe-card"
              style={style}
              data-top={index === 0 ? "" : undefined}
              aria-hidden={index !== 0}
              onPointerDown={index === 0 ? begin : undefined}
              onPointerMove={index === 0 ? move : undefined}
              onPointerUp={index === 0 ? end : undefined}
              onPointerCancel={index === 0 ? end : undefined}
            >
              <Artwork hue={card.hue} />
              <span className="swipe-stamp swipe-stamp-like" aria-hidden="true">
                Like
              </span>
              <span className="swipe-stamp swipe-stamp-skip" aria-hidden="true">
                Skip
              </span>
              <span className="card-caption">
                <small>{card.subtitle}</small>
                <strong>{card.title}</strong>
              </span>
            </div>
          );
        })}
      </div>
      <div className="swipe-controls">
        <button
          type="button"
          className="demo-round swipe-skip"
          aria-label="Skip"
          disabled={cards.length === 0}
          onClick={() => swipe("left")}
        >
          <X aria-hidden="true" />
        </button>
        <button
          type="button"
          className="demo-round swipe-like"
          aria-label="Like"
          disabled={cards.length === 0}
          onClick={() => swipe("right")}
        >
          <Heart aria-hidden="true" />
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
