import { RotateCcw } from "lucide-react";
import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  type NativeAction,
  type NativeSession,
  nativeActionSchema,
  nativeSessionSchema,
  nativeTouch,
} from "../lib/native-preview";
import { IPhone, PhoneFrame } from "./iphone";

export default function LiveIPhone({ name, title }: { name: string; title: string }) {
  const [session, setSession] = useState<NativeSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [actions, setActions] = useState<NativeAction[]>([]);
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const connection = useRef<WebSocket | null>(null);
  const pointer = useRef<number | null>(null);
  const lastPoint = useRef({ x: 0, y: 0 });
  const lifecycle = useRef<AbortController | null>(null);
  const refresh = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const send = useCallback((type: 0 | 1 | 2, x: number, y: number) => {
    const socket = connection.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(nativeTouch(type, x, y));
    }
  }, []);

  const updateActions = useCallback(async function readActions(attempt = 0): Promise<void> {
    const controller = lifecycle.current;
    if (!controller || controller.signal.aborted) {
      return;
    }
    try {
      const response = await fetch("/__native/actions", { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Native actions are unavailable.");
      }
      const result = nativeActionSchema.array().parse(await response.json());
      if (!controller.signal.aborted) {
        setActions(result);
        if (result.length === 0 && attempt < 4) {
          refresh.current = setTimeout(() => {
            void readActions(attempt + 1);
          }, 300);
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        setActions([]);
        if (attempt < 4) {
          refresh.current = setTimeout(() => {
            void readActions(attempt + 1);
          }, 300);
        }
      }
    }
  }, []);

  function scheduleActions() {
    clearTimeout(refresh.current);
    refresh.current = setTimeout(() => {
      void updateActions();
    }, 500);
  }

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    setSession(null);
    setConnected(false);
    setRendered(false);
    setFailed(false);
    setActions([]);
    async function start() {
      try {
        const response = await fetch(
          `/__native/session/${name}?reduceMotion=${reduceMotion}&revision=${revision}`,
          {
            method: "POST",
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error("Native preview is unavailable.");
        }
        const native = nativeSessionSchema.parse(await response.json());
        if (controller.signal.aborted) {
          return;
        }
        setSession(native);
        const url = new URL("/__native/input", location.href);
        url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
        const socket = new WebSocket(url);
        connection.current = socket;
        socket.onopen = () => {
          if (controller.signal.aborted) {
            return;
          }
          setConnected(true);
          void updateActions();
        };
        socket.onerror = () => {
          if (!controller.signal.aborted) {
            setFailed(true);
          }
        };
        socket.onclose = () => {
          if (!controller.signal.aborted) {
            setConnected(false);
            setFailed(true);
          }
        };
      } catch {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      }
    }
    void start();
    return () => {
      controller.abort();
      clearTimeout(refresh.current);
      if (pointer.current !== null) {
        send(2, lastPoint.current.x, lastPoint.current.y);
        pointer.current = null;
      }
      connection.current?.close();
      connection.current = null;
    };
  }, [name, revision, reduceMotion, send, updateActions]);

  useEffect(() => {
    if (failed) {
      if (pointer.current !== null) {
        send(2, lastPoint.current.x, lastPoint.current.y);
        pointer.current = null;
      }
      connection.current?.close();
      connection.current = null;
    }
  }, [failed, send]);

  function point(event: PointerEvent<HTMLFieldSetElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    };
  }

  function begin(event: PointerEvent<HTMLFieldSetElement>) {
    if (!connected || pointer.current !== null || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = event.pointerId;
    lastPoint.current = point(event);
    send(0, lastPoint.current.x, lastPoint.current.y);
  }

  function move(event: PointerEvent<HTMLFieldSetElement>) {
    if (pointer.current !== event.pointerId) {
      return;
    }
    lastPoint.current = point(event);
    send(1, lastPoint.current.x, lastPoint.current.y);
  }

  function end(event: PointerEvent<HTMLFieldSetElement>) {
    if (pointer.current !== event.pointerId) {
      return;
    }
    lastPoint.current = point(event);
    send(2, lastPoint.current.x, lastPoint.current.y);
    pointer.current = null;
    scheduleActions();
  }

  function activate(action: NativeAction) {
    if (pointer.current !== null || connection.current?.readyState !== WebSocket.OPEN) {
      return;
    }
    const x = action.x + action.width / 2;
    const y = action.y + action.height / 2;
    pointer.current = -1;
    lastPoint.current = { x, y };
    clearTimeout(refresh.current);
    send(0, x, y);
    refresh.current = setTimeout(() => {
      send(2, x, y);
      pointer.current = null;
      scheduleActions();
    }, 40);
  }

  if (failed) {
    return (
      <div className="live-preview-unavailable">
        <IPhone name={name} title={title} playable priority />
        <p role="status">Live preview unavailable. The native recording is still available.</p>
        <button type="button" className="text-link" onClick={() => setRevision(revision + 1)}>
          Retry live preview
        </button>
      </div>
    );
  }

  const ready = connected && rendered;
  return (
    <div className="device-preview live-device">
      <PhoneFrame aspectRatio={session ? session.width / session.height : 402 / 874} native>
        <fieldset
          className="native-touch-surface"
          aria-label={`${title} live native iPhone preview`}
          aria-busy={!ready}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: These events report stream loading, not input. */}
          <img
            src={session ? `/__native/screen?revision=${revision}` : `/native/${name}.webp`}
            width={session?.width ?? 1206}
            height={session?.height ?? 2622}
            alt={`${title}, running in the native iPhone simulator`}
            draggable={false}
            onLoad={() => setRendered(session !== null)}
            onError={() => setFailed(true)}
          />
          {connected &&
            actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="native-action"
                aria-label={action.label}
                onClick={() => activate(action)}
                style={{
                  left: `${action.x * 100}%`,
                  top: `${action.y * 100}%`,
                  width: `${action.width * 100}%`,
                  height: `${action.height * 100}%`,
                }}
              />
            ))}
        </fieldset>
      </PhoneFrame>
      <div className="native-session-status">
        <span className="native-session-label" role="status">
          <span className={ready ? "native-live-dot" : "native-waiting-dot"} />
          {ready ? "Live SwiftUI" : "Starting iPhone…"}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Reset native preview"
          disabled={!ready}
          onClick={() => setRevision(revision + 1)}
        >
          <RotateCcw size={13} />
        </button>
      </div>
      <p className="native-device-label">{session?.model ?? "iPhone"} · Local simulator</p>
      <span className="sr-only">
        Tap or drag the screen, or Tab to the native component actions.
      </span>
    </div>
  );
}
