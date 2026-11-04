import { lazy, Suspense, useEffect, useState } from "react";
import { type PreviewDefinition, previewScreen } from "../../registry/preview";
import { IPhone } from "./iphone";

const LiveIPhone =
  import.meta.env.DEV && import.meta.env["VITE_HUGSY_NATIVE"] === true
    ? lazy(() => import("./live-iphone"))
    : null;

export function ComponentPreview({
  name,
  title,
  definition,
}: {
  name: string;
  title: string;
  definition: PreviewDefinition | undefined;
}) {
  const [screenID, setScreenID] = useState(definition?.initialScreen);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!definition) {
    return (
      <p className="native-note">
        This component has no visual preview. See its source and integration guide below.
      </p>
    );
  }
  const screen = previewScreen(definition, screenID);
  return (
    <div className="component-preview">
      {(definition.screens.length > 1 || LiveIPhone) && (
        <div className="preview-options">
          {definition.screens.length > 1 && (
            <fieldset className="preview-screen-switcher">
              <legend className="sr-only">Component screens</legend>
              {definition.screens.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={item.id === screen.id}
                  disabled={!ready}
                  onClick={() => {
                    setScreenID(item.id);
                    setLive(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </fieldset>
          )}
          {LiveIPhone && (
            <button
              className="text-link"
              type="button"
              disabled={!ready}
              onClick={() => setLive(!live)}
            >
              {live ? "Watch recording" : "Try live locally"}
            </button>
          )}
        </div>
      )}
      <div className={`native-stage visual-${name}`} data-preview-screen={screen.id}>
        {LiveIPhone && live ? (
          <Suspense fallback={<IPhone name={name} title={title} asset={screen.asset} priority />}>
            <LiveIPhone
              key={`${name}/${screen.id}`}
              name={name}
              title={title}
              screen={screen.id}
              asset={screen.asset}
            />
          </Suspense>
        ) : (
          <IPhone
            key={screen.id}
            name={name}
            title={title}
            asset={screen.asset}
            playable
            priority
          />
        )}
      </div>
    </div>
  );
}
