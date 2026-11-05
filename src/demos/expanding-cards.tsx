import { type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "../components/icons";
import { Artwork, type Story, stories, useReducedMotion } from "./shared";

const items = stories.slice(0, 3);
type Box = { top: number; left: number; width: number; height: number };

function boxOf(element: Element, stage: Element): Box {
  const own = element.getBoundingClientRect();
  const parent = stage.getBoundingClientRect();
  return {
    top: own.top - parent.top,
    left: own.left - parent.left,
    width: own.width,
    height: own.height,
  };
}

function frame(box: Box, radius: string) {
  return {
    top: `${box.top}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    borderRadius: radius,
  };
}

function morph(element: HTMLElement, card: HTMLElement, stage: Element, opening: boolean) {
  const collapsed = frame(boxOf(card, stage), getComputedStyle(card).borderRadius);
  const expanded = frame(boxOf(element, stage), getComputedStyle(element).borderRadius);
  const easing = getComputedStyle(element).getPropertyValue("--spring-smooth").trim() || "ease-out";
  const timing: KeyframeAnimationOptions = {
    duration: 560,
    easing,
    fill: opening ? "none" : "forwards",
  };
  const ordered = <Value,>(small: Value, large: Value) =>
    opening ? [small, large] : [large, small];
  const title = element.querySelector("strong");
  const cardTitle = card.querySelector("strong");
  if (title && cardTitle) {
    title.animate(
      ordered(
        { fontSize: getComputedStyle(cardTitle).fontSize },
        { fontSize: getComputedStyle(title).fontSize },
      ),
      timing,
    );
  }
  const detail = element.querySelector<HTMLElement>(".expanded-detail");
  if (detail) {
    detail.animate(
      ordered(
        { opacity: 0, maxHeight: "0px", marginTop: "0px" },
        {
          opacity: 1,
          maxHeight: `${detail.offsetHeight}px`,
          marginTop: getComputedStyle(detail).marginTop,
        },
      ),
      timing,
    );
  }
  return element.animate(ordered(collapsed, expanded), timing);
}

export default function ExpandingCards() {
  const [open, setOpen] = useState<Story | null>(null);
  const [closingCard, setClosingCard] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const drag = useRef<{ pointer: number; y: number; offset: number } | null>(null);
  const closing = useRef(false);
  const returnFocus = useRef<string | null>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const element = overlay.current;
    const card = open ? cards.current.get(open.id) : undefined;
    if (!open || !element || !stage.current || !card) {
      return;
    }
    close.current?.focus({ preventScroll: true });
    if (reduced) {
      return;
    }
    morph(element, card, stage.current, true);
  }, [open, reduced]);

  useEffect(() => {
    if (!open && returnFocus.current) {
      cards.current.get(returnFocus.current)?.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [open]);

  function dismiss() {
    const element = overlay.current;
    const card = open ? cards.current.get(open.id) : undefined;
    if (!open || !element || !stage.current || !card || closing.current) {
      return;
    }
    closing.current = true;
    setClosingCard(true);
    const restore = () => {
      closing.current = false;
      returnFocus.current = open.id;
      setClosingCard(false);
      setOpen(null);
    };
    if (reduced) {
      restore();
      return;
    }
    const animation = morph(element, card, stage.current, false);
    element.style.transform = "";
    animation.onfinish = restore;
  }

  function begin(event: PointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, y: event.clientY, offset: 0 };
    event.currentTarget.dataset["dragging"] = "";
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    current.offset = Math.max(0, event.clientY - current.y);
    const scale = reduced ? 1 : 1 - Math.min(current.offset, 320) / 1600;
    event.currentTarget.style.transform = `translateY(${current.offset}px) scale(${scale})`;
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    drag.current = null;
    delete event.currentTarget.dataset["dragging"];
    if (current.offset > 120) {
      dismiss();
    } else {
      event.currentTarget.style.transform = "";
    }
  }

  return (
    <div className="demo cards-demo">
      <p className="demo-title">Stories</p>
      <div className="cards-stage" ref={stage} data-open={open !== null && !closingCard}>
        <div className="cards-list">
          {items.map((story) => (
            <button
              type="button"
              key={story.id}
              className="expanding-card"
              data-selected={open?.id === story.id}
              aria-label={`Open ${story.title}`}
              tabIndex={open ? -1 : 0}
              ref={(element) => {
                if (element) {
                  cards.current.set(story.id, element);
                } else {
                  cards.current.delete(story.id);
                }
              }}
              onClick={() => setOpen(story)}
            >
              <Artwork hue={story.hue} />
              <span className="card-caption">
                <small>{story.subtitle}</small>
                <strong>{story.title}</strong>
              </span>
            </button>
          ))}
        </div>
        {open && (
          // biome-ignore lint/a11y/noNoninteractiveElementInteractions: The close button and Escape key provide the same dismissal without dragging.
          <div
            className="expanded-card"
            ref={overlay}
            role="dialog"
            aria-label={open.title}
            onPointerDown={begin}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                dismiss();
              }
            }}
          >
            <Artwork hue={open.hue} />
            <button
              type="button"
              className="demo-round expanded-close"
              aria-label="Close details"
              ref={close}
              onClick={dismiss}
            >
              <X aria-hidden="true" />
            </button>
            <span className="card-caption expanded-caption">
              <small>{open.subtitle}</small>
              <strong>{open.title}</strong>
              <span className="expanded-detail">
                Some things are better with a little more space. Drag down or close to return to the
                list.
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
