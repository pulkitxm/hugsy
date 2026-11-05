import { Laptop, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { Suspense, startTransition, useEffect, useState } from "react";
import { demos } from "../demos/registry";
import { Device, type DeviceKind, deviceKinds } from "./device";

const icons = { iphone: Smartphone, ipad: Tablet, mac: Laptop };

export function DevicePreview({ name, title }: { name: string; title: string }) {
  const screens = demos[name] ?? [];
  const [kind, setKind] = useState<DeviceKind>("iphone");
  const [screenID, setScreenID] = useState(screens[0]?.id);
  const [session, setSession] = useState(0);
  const [switched, setSwitched] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => startTransition(() => setReady(true)), []);
  const screen = screens.find((item) => item.id === screenID) ?? screens[0];
  if (!screen) {
    return null;
  }
  const Demo = screen.component;
  const device = deviceKinds.find((item) => item.kind === kind) ?? deviceKinds[0];
  return (
    <section className="preview-frame device-preview" aria-label={`${title} preview`}>
      <div className="preview-bar">
        <span className="preview-hint">{screen.hint}</span>
        <div className="preview-controls">
          {screens.length > 1 && (
            <fieldset className="segmented" disabled={!ready}>
              <legend className="sr-only">Screen</legend>
              {screens.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={screen.id === item.id}
                  onClick={() => setScreenID(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </fieldset>
          )}
          <fieldset className="segmented" disabled={!ready}>
            <legend className="sr-only">Device</legend>
            {deviceKinds.map((item) => {
              const Icon = icons[item.kind];
              return (
                <button
                  type="button"
                  key={item.kind}
                  aria-pressed={kind === item.kind}
                  onClick={() => {
                    setSwitched(true);
                    setKind(item.kind);
                  }}
                >
                  <Icon aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </fieldset>
          <button
            type="button"
            className="icon-button"
            aria-label="Reset preview"
            disabled={!ready}
            onClick={() => setSession(session + 1)}
          >
            <RotateCcw aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="device-stage" data-device={kind}>
        <Device
          key={kind}
          kind={kind}
          label={`${title} on ${device?.label ?? "iPhone"}`}
          animate={switched}
        >
          <Suspense fallback={<div className="demo" />}>
            <Demo key={`${screen.id}-${session}`} variant={screen.id} />
          </Suspense>
        </Device>
      </div>
      <p className="preview-note">
        {device?.model} · Interactive web preview of the native component
      </p>
    </section>
  );
}
