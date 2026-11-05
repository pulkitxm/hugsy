import { Laptop, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { demos } from "../demos/registry";
import { Device, type DeviceKind, deviceKinds } from "./device";

const icons = { iphone: Smartphone, ipad: Tablet, mac: Laptop };

export function DevicePreview({ name, title }: { name: string; title: string }) {
  const screens = demos[name] ?? [];
  const [kind, setKind] = useState<DeviceKind>("iphone");
  const [screenID, setScreenID] = useState(screens[0]?.id);
  const [session, setSession] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const screen = screens.find((item) => item.id === screenID) ?? screens[0];
  if (!screen) {
    return null;
  }
  const Demo = screen.component;
  const label = deviceKinds.find((item) => item.kind === kind)?.label ?? "iPhone";
  return (
    <section className="device-preview" aria-label={`${title} preview`}>
      <div className="preview-toolbar">
        <fieldset className="segmented" disabled={!ready}>
          <legend className="sr-only">Device</legend>
          {deviceKinds.map((item) => {
            const Icon = icons[item.kind];
            return (
              <button
                type="button"
                key={item.kind}
                aria-pressed={kind === item.kind}
                onClick={() => setKind(item.kind)}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </fieldset>
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
      <Device kind={kind} label={`${title} on ${label}`}>
        <Suspense fallback={<div className="demo" />}>
          <Demo key={`${screen.id}-${session}`} variant={screen.id} />
        </Suspense>
      </Device>
      <p className="preview-note">Interactive web preview. Install for the native component.</p>
    </section>
  );
}
