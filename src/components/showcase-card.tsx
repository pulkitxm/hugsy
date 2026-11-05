import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { demos } from "../demos/registry";
import { Device } from "./device";

export function ShowcaseCard({ name, title }: { name: string; title: string }) {
  const screen = demos[name]?.[0];
  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    const idle = setTimeout(() => setVisible(true), 2500);
    return () => {
      observer.disconnect();
      clearTimeout(idle);
    };
  }, []);
  if (!screen) {
    return null;
  }
  const Demo = screen.component;
  return (
    <article className="preview-frame showcase-card">
      <div className="preview-bar">
        <h2>{title}</h2>
        <span className="preview-hint">{screen.hint}</span>
        <Link to="/components/$name/" params={{ name }} aria-label={`Open ${title}`}>
          Open
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <div className="showcase-stage" ref={stage}>
        <Device kind="iphone" label={`${title} on iPhone`}>
          {visible ? (
            <Suspense fallback={<div className="demo" />}>
              <Demo variant={screen.id} />
            </Suspense>
          ) : (
            <div className="demo" />
          )}
        </Device>
      </div>
    </article>
  );
}
