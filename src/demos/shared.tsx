import { type CSSProperties, useEffect, useState } from "react";

export type CSSVariables = CSSProperties & { [variable: `--${string}`]: string | number };

export type Story = { id: string; title: string; subtitle: string; hue: number };

export const stories: Story[] = [
  { id: "dunes", title: "Quiet dunes", subtitle: "A slower weekend", hue: 28 },
  { id: "harbor", title: "Blue harbor", subtitle: "Notes from the coast", hue: 205 },
  { id: "grove", title: "Olive grove", subtitle: "Morning walks", hue: 92 },
  { id: "dusk", title: "City at dusk", subtitle: "After the last light", hue: 262 },
  { id: "bloom", title: "Late bloom", subtitle: "Small rituals", hue: 334 },
];

export function Artwork({ hue, className = "" }: { hue: number; className?: string }) {
  const style: CSSVariables = { "--hue": hue };
  return <span className={`artwork ${className}`} style={style} aria-hidden="true" />;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
