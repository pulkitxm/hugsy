import { lazy, Suspense } from "react";
import { IPhone } from "./iphone";

const LiveIPhone =
  import.meta.env.DEV && import.meta.env["VITE_HUGSY_NATIVE"] === true
    ? lazy(() => import("./live-iphone"))
    : null;

export function ComponentPreview({ name, title }: { name: string; title: string }) {
  return (
    <div className={`native-stage visual-${name}`}>
      {LiveIPhone ? (
        <Suspense fallback={<IPhone name={name} title={title} priority />}>
          <LiveIPhone key={name} name={name} title={title} />
        </Suspense>
      ) : (
        <IPhone name={name} title={title} playable priority />
      )}
    </div>
  );
}
