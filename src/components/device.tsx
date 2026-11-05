import type { ReactNode } from "react";

export type DeviceKind = "iphone" | "ipad" | "mac";

export const deviceKinds: { kind: DeviceKind; label: string; model: string }[] = [
  { kind: "iphone", label: "iPhone", model: "iPhone 17 Pro" },
  { kind: "ipad", label: "iPad", model: "iPad Pro 11-inch" },
  { kind: "mac", label: "Mac", model: "MacBook Pro 14-inch" },
];

function Cellular() {
  return (
    <svg viewBox="0 0 18 12" aria-hidden="true">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  );
}

function Wifi() {
  return (
    <svg viewBox="0 0 16 12" aria-hidden="true">
      <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.3-1.4A10.6 10.6 0 0 0 8 .7 10.6 10.6 0 0 0 .7 3.6L2 5a8.6 8.6 0 0 1 6-2.4Zm0 3.7c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 0 0 8 4.4c-1.8 0-3.4.7-4.7 1.8L4.6 7.6c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.6 0-1.1.2-1.5.6L8 12l1.5-1.5c-.4-.4-.9-.6-1.5-.6Z" />
    </svg>
  );
}

function Battery() {
  return (
    <svg viewBox="0 0 27 12" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="11"
        rx="3.5"
        fill="none"
        stroke="currentColor"
        opacity="0.4"
      />
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="25" y="4" width="1.5" height="4" rx="0.75" opacity="0.4" />
    </svg>
  );
}

function StatusBar({ kind }: { kind: "iphone" | "ipad" }) {
  return (
    <div className="device-status" aria-hidden="true">
      <span className="status-time">
        {kind === "ipad" ? (
          <>
            9:41 <span>Tue 5 Nov</span>
          </>
        ) : (
          "9:41"
        )}
      </span>
      <span className="status-icons">
        <Cellular />
        <Wifi />
        <Battery />
      </span>
    </div>
  );
}

function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="device-body">
      <span className="device-button button-action" />
      <span className="device-button button-volume-up" />
      <span className="device-button button-volume-down" />
      <span className="device-button button-side" />
      <span className="device-button button-camera-control" />
      <div className="device-bezel">
        <section className="device-screen" aria-label={label}>
          <div className="device-viewport">
            {children}
            <StatusBar kind="iphone" />
            <span className="device-island" aria-hidden="true" />
            <span className="device-home" aria-hidden="true" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Tablet({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="device-body">
      <span className="device-button button-top" />
      <span className="device-button button-volume-up" />
      <span className="device-button button-volume-down" />
      <div className="device-bezel">
        <span className="device-camera" aria-hidden="true" />
        <section className="device-screen" aria-label={label}>
          <div className="device-viewport">
            {children}
            <StatusBar kind="ipad" />
            <span className="device-home" aria-hidden="true" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Laptop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div className="device-body">
        <div className="device-bezel">
          <section className="device-screen" aria-label={label}>
            <span className="mac-wallpaper" aria-hidden="true" />
            <div className="mac-menu-bar" aria-hidden="true">
              <span className="mac-menus">
                <strong>Hugsy</strong>
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Window</span>
                <span>Help</span>
              </span>
              <span className="mac-extras">
                <Wifi />
                <Battery />
                <span>Tue 5 Nov 9:41</span>
              </span>
            </div>
            <div className="mac-window">
              <div className="mac-titlebar" aria-hidden="true">
                <span className="mac-lights">
                  <span />
                  <span />
                  <span />
                </span>
                <span>Hugsy</span>
              </div>
              <div className="device-viewport">{children}</div>
            </div>
            <div className="mac-dock" aria-hidden="true">
              {[210, 28, 140, 330, 95, 260].map((hue) => (
                <span key={hue} style={{ background: `hsl(${hue} 70% 58%)` }} />
              ))}
            </div>
            <span className="mac-notch" aria-hidden="true" />
          </section>
        </div>
      </div>
      <span className="device-base" aria-hidden="true" />
    </>
  );
}

export function Device({
  kind,
  label,
  animate = false,
  children,
}: {
  kind: DeviceKind;
  label: string;
  animate?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="device" data-device={kind} data-animate={animate}>
      {kind === "iphone" && <Phone label={label}>{children}</Phone>}
      {kind === "ipad" && <Tablet label={label}>{children}</Tablet>}
      {kind === "mac" && <Laptop label={label}>{children}</Laptop>}
    </div>
  );
}
