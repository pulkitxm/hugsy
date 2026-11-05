import { memo, Suspense, startTransition, useEffect, useState } from "react";
import { demos } from "../demos/registry";
import { Device, type DeviceKind, deviceKinds } from "./device";
import { Laptop, RotateCcw, Smartphone, Tablet } from "./icons";

const icons = { iphone: Smartphone, ipad: Tablet, mac: Laptop };

const PreviewStage = memo(function PreviewStage({
  name,
  screenID,
  kind,
  label,
  animate,
  session,
}: {
  name: string;
  screenID: string;
  kind: DeviceKind;
  label: string;
  animate: boolean;
  session: number;
}) {
  const screen = demos[name]?.find((item) => item.id === screenID);
  if (!screen) {
    return null;
  }
  const Demo = screen.component;
  return (
    <div className="device-stage" data-device={kind}>
      <Device key={kind} kind={kind} label={label} animate={animate}>
        <Suspense fallback={<div className="demo" />}>
          <Demo key={`${screen.id}-${session}`} variant={screen.id} />
        </Suspense>
      </Device>
    </div>
  );
});

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
      <PreviewStage
        name={name}
        screenID={screen.id}
        kind={kind}
        label={`${title} on ${device?.label ?? "iPhone"}`}
        animate={switched}
        session={session}
      />
      <p className="preview-note">
        {device?.model} · Interactive web preview of the native component
      </p>
    </section>
  );
}
