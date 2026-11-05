import { createContext, type ReactNode, useContext } from "react";
import type { Highlights } from "../../registry/highlight";

const HighlightContext = createContext<Highlights>({});

export function HighlightProvider({
  highlights,
  children,
}: {
  highlights: Highlights;
  children: ReactNode;
}) {
  return <HighlightContext value={highlights}>{children}</HighlightContext>;
}

export function useHighlight(code: string) {
  return useContext(HighlightContext)[code];
}

export async function loadDocsHighlights() {
  return (await import("../../generated/docs.ts")).highlights;
}
