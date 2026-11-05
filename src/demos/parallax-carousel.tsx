import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Artwork, stories, useReducedMotion } from "./shared";

type Grab = {
  pointer: number;
  x: number;
  scroll: number;
  lastX: number;
  time: number;
  velocity: number;
};

export default function ParallaxCarousel() {
  const track = useRef<HTMLElement>(null);
  const grab = useRef<Grab | null>(null);
  const frame = useRef(0);
  const [selected, setSelected] = useState(0);
  const reduced = useReducedMotion();

  const update = useCallback(() => {
    frame.current = 0;
    const element = track.current;
    if (!element) {
      return;
    }
    const center = element.scrollLeft + element.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(element.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) {
        return;
      }
      const offset = (child.offsetLeft + child.offsetWidth / 2 - center) / child.offsetWidth;
      const clamped = Math.max(-1, Math.min(1, offset));
      child.style.setProperty("--offset", `${clamped}`);
      child.style.setProperty("--distance", `${Math.abs(clamped)}`);
      if (Math.abs(offset) < distance) {
        distance = Math.abs(offset);
        nearest = index;
      }
    });
    setSelected(nearest);
  }, []);

  const schedule = useCallback(() => {
    if (!frame.current) {
      frame.current = requestAnimationFrame(update);
    }
  }, [update]);

  useEffect(() => {
    update();
    const element = track.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [schedule, update]);

  function scrollTo(index: number) {
    const element = track.current;
    const card = element?.children[index];
    if (!element || !(card instanceof HTMLElement)) {
      return;
    }
    element.scrollTo({
      left: card.offsetLeft - (element.clientWidth - card.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  function begin(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !track.current) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    grab.current = {
      pointer: event.pointerId,
      x: event.clientX,
      scroll: track.current.scrollLeft,
      lastX: event.clientX,
      time: event.timeStamp,
      velocity: 0,
    };
    track.current.dataset["grabbing"] = "";
  }

  function move(event: PointerEvent<HTMLElement>) {
    const current = grab.current;
    if (!current || current.pointer !== event.pointerId || !track.current) {
      return;
    }
    current.velocity =
      (event.clientX - current.lastX) / Math.max(1, event.timeStamp - current.time);
    current.lastX = event.clientX;
    current.time = event.timeStamp;
    track.current.scrollLeft = current.scroll - (event.clientX - current.x);
  }

  function end(event: PointerEvent<HTMLElement>) {
    const current = grab.current;
    if (!current || current.pointer !== event.pointerId || !track.current) {
      return;
    }
    grab.current = null;
    delete track.current.dataset["grabbing"];
    const fling = Math.abs(current.velocity) > 0.4 ? -Math.sign(current.velocity) : 0;
    scrollTo(Math.max(0, Math.min(stories.length - 1, selected + fling)));
  }

  return (
    <div className="demo carousel-demo">
      <p className="demo-title">Places</p>
      <section
        className="carousel-track"
        ref={track}
        aria-label="Places"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users scroll the carousel with arrow keys.
        tabIndex={0}
        onScroll={schedule}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {stories.map((story, index) => (
          <figure
            key={story.id}
            className="carousel-card"
            aria-label={`${story.title}, ${index + 1} of ${stories.length}`}
          >
            <Artwork hue={story.hue} className="carousel-art" />
            <figcaption className="card-caption">
              <small>{story.subtitle}</small>
              <strong>{story.title}</strong>
            </figcaption>
          </figure>
        ))}
      </section>
      <div className="carousel-indicators">
        {stories.map((story, index) => (
          <button
            type="button"
            key={story.id}
            aria-label={`Show ${story.title}, ${index + 1} of ${stories.length}`}
            aria-pressed={selected === index}
            onClick={() => scrollTo(index)}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}
