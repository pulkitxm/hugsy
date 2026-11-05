import {
  CircleCheck,
  Package,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Store,
  Truck,
} from "lucide-react";
import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import type { DemoProps } from "./registry";
import { Artwork, type CSSVariables, stories } from "./shared";

type Phase = "compact" | "alert" | "expanded";

const phases: { phase: Phase; label: string }[] = [
  { phase: "compact", label: "Compact" },
  { phase: "alert", label: "Alert" },
  { phase: "expanded", label: "Expanded" },
];

function Waveform({ playing }: { playing: boolean }) {
  return (
    <span className="capsule-wave" data-playing={playing} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function PlayerContent({ phase }: { phase: Phase }) {
  const [playing, setPlaying] = useState(true);
  const layers: Record<Phase, ReactNode> = {
    compact: (
      <span className="capsule-row">
        <Waveform playing={playing} />
        <span className="capsule-time">2:14</span>
      </span>
    ),
    alert: (
      <span className="capsule-row capsule-alert">
        <CircleCheck className="capsule-success" aria-hidden="true" />
        <span>Added to Library</span>
      </span>
    ),
    expanded: (
      <span className="capsule-panel">
        <span className="capsule-media">
          <span className="capsule-cover" aria-hidden="true" />
          <span>
            <strong>Morning Mix</strong>
            <small>Synthetic Artist</small>
          </span>
          <Waveform playing={playing} />
        </span>
        <span className="capsule-progress" aria-hidden="true">
          <span />
        </span>
        <span className="capsule-controls">
          <button type="button" aria-label="Previous track">
            <SkipBack aria-hidden="true" />
          </button>
          <button
            type="button"
            className="capsule-play"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <button type="button" aria-label="Next track">
            <SkipForward aria-hidden="true" />
          </button>
        </span>
      </span>
    ),
  };
  return <Layers phase={phase} layers={layers} />;
}

function DeliveryContent({ phase }: { phase: Phase }) {
  const layers: Record<Phase, ReactNode> = {
    compact: (
      <span className="capsule-row">
        <Package className="capsule-accent" aria-hidden="true" />
        <span className="capsule-time">8 min</span>
      </span>
    ),
    alert: (
      <span className="capsule-row capsule-alert">
        <Truck className="capsule-accent" aria-hidden="true" />
        <span>Your courier is nearby</span>
      </span>
    ),
    expanded: (
      <span className="capsule-panel">
        <span className="capsule-media">
          <span className="capsule-badge" aria-hidden="true">
            <Store />
          </span>
          <span>
            <strong>Arriving in 8 min</strong>
            <small>Order 2048 from Synthetic Bistro</small>
          </span>
        </span>
        <span className="capsule-steps" aria-hidden="true">
          <span data-done="" />
          <span data-done="" />
          <span />
        </span>
        <span className="capsule-step-labels">
          <span>Prepared</span>
          <span>On the way</span>
          <span>Delivered</span>
        </span>
      </span>
    ),
  };
  return <Layers phase={phase} layers={layers} />;
}

function Layers({ phase, layers }: { phase: Phase; layers: Record<Phase, ReactNode> }) {
  return (
    <>
      {phases.map((item) => (
        <span
          key={item.phase}
          className="capsule-layer"
          data-active={item.phase === phase}
          aria-hidden={item.phase !== phase}
          inert={item.phase !== phase}
        >
          {layers[item.phase]}
        </span>
      ))}
    </>
  );
}

export default function MorphingCapsule({ variant }: DemoProps) {
  const [phase, setPhase] = useState<Phase>("compact");
  const [stretch, setStretch] = useState(0);
  const drag = useRef<{ pointer: number; y: number; moved: boolean } | null>(null);

  function rubberBand(distance: number) {
    const limit = 28;
    return Math.sign(distance) * limit * (1 - 1 / (Math.abs(distance) / limit / 3 + 1));
  }

  function begin(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, y: event.clientY, moved: false };
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    const distance = event.clientY - current.y;
    if (Math.abs(distance) > 6) {
      current.moved = true;
    }
    setStretch(rubberBand(distance));
  }

  function end(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) {
      return;
    }
    const distance = event.clientY - current.y;
    if (distance > 36 && phase !== "expanded") {
      setPhase("expanded");
    } else if (distance < -36 && phase === "expanded") {
      setPhase("compact");
    }
    setStretch(0);
    if (!current.moved) {
      drag.current = null;
      return;
    }
    requestAnimationFrame(() => {
      drag.current = null;
    });
  }

  function toggle() {
    if (drag.current?.moved) {
      return;
    }
    setPhase(phase === "expanded" ? "compact" : "expanded");
  }

  const style: CSSVariables = { "--stretch": `${stretch}px` };
  return (
    <div className="demo capsule-demo" data-variant={variant}>
      <div className="capsule" data-phase={phase} data-dragging={stretch !== 0} style={style}>
        <button
          type="button"
          className="capsule-surface"
          aria-label={phase === "expanded" ? "Collapse capsule" : "Expand capsule"}
          aria-expanded={phase === "expanded"}
          onClick={toggle}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setPhase("compact");
            }
          }}
        />
        {variant === "delivery" ? (
          <DeliveryContent phase={phase} />
        ) : (
          <PlayerContent phase={phase} />
        )}
      </div>
      <div className="capsule-stage">
        <p className="demo-title">{variant === "delivery" ? "Orders" : "Listen now"}</p>
        <p className="demo-hint">Tap or pull the capsule.</p>
        <ul className="capsule-list">
          {stories.slice(0, 4).map((story) => (
            <li key={story.id}>
              <Artwork hue={story.hue} />
              <span>
                <strong>{variant === "delivery" ? `${story.title} kitchen` : story.title}</strong>
                <small>{variant === "delivery" ? "Delivered last week" : story.subtitle}</small>
              </span>
            </li>
          ))}
        </ul>
        <fieldset className="demo-segmented">
          <legend className="sr-only">Capsule phase</legend>
          {phases.map((item) => (
            <button
              type="button"
              key={item.phase}
              aria-pressed={phase === item.phase}
              onClick={() => setPhase(item.phase)}
            >
              {item.label}
            </button>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
