export type HighlightToken = [text: string, light: string, dark: string, offset: number];
type HighlightLine = { start: number; tokens: HighlightToken[] };
export type Highlights = Record<string, HighlightLine[]>;
