import type { ReactNode } from "react";

export type DeviceKind = "iphone" | "ipad" | "mac";

export const deviceKinds: { kind: DeviceKind; label: string }[] = [
  { kind: "iphone", label: "iPhone" },
  { kind: "ipad", label: "iPad" },
  { kind: "mac", label: "Mac" },
];

function StatusIcons() {
  return (
    <span className="status-icons">
      <svg viewBox="0 0 18 12" aria-hidden="true">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg viewBox="0 0 16 12" aria-hidden="true">
        <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.3-1.4A10.6 10.6 0 0 0 8 .7 10.6 10.6 0 0 0 .7 3.6L2 5a8.6 8.6 0 0 1 6-2.4Zm0 3.7c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 0 0 8 4.4c-1.8 0-3.4.7-4.7 1.8L4.6 7.6c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.6 0-1.1.2-1.5.6L8 12l1.5-1.5c-.4-.4-.9-.6-1.5-.6Z" />
      </svg>
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
    </span>
  );
}

function StatusBar({ kind }: { kind: DeviceKind }) {
  if (kind === "mac") {
    return (
      <div className="device-status menu-bar" aria-hidden="true">
        <span className="menu-items">
          <strong>Hugsy</strong>
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Window</span>
        </span>
        <span>Tue 9:41</span>
      </div>
    );
  }
  return (
    <div className="device-status" aria-hidden="true">
      <span className="status-time">{kind === "ipad" ? "9:41  Tue 5 Nov" : "9:41"}</span>
      <StatusIcons />
    </div>
  );
}

export function Device({
  kind,
  label,
  children,
}: {
  kind: DeviceKind;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="device" data-device={kind}>
      <div className="device-body">
        {kind === "iphone" && (
          <>
            <span className="device-button device-button-action" aria-hidden="true" />
            <span className="device-button device-button-volume" aria-hidden="true" />
            <span className="device-button device-button-power" aria-hidden="true" />
          </>
        )}
        <section className="device-screen" aria-label={label}>
          <StatusBar kind={kind} />
          <div className="device-content">{children}</div>
          {kind === "iphone" && <span className="device-island" aria-hidden="true" />}
          {kind !== "mac" && <span className="device-home" aria-hidden="true" />}
        </section>
      </div>
      {kind === "mac" && <span className="device-base" aria-hidden="true" />}
    </div>
  );
}
