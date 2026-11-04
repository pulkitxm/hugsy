import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { catalog } from "./registry/catalog.ts";
import { nativePreview } from "./scripts/native-preview.ts";

export default defineConfig({
  base: "/",
  plugins: [
    nativePreview(),
    tanstackStart({
      router: { basepath: "/", routeTreeFileHeader: [] },
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        failOnError: true,
        autoSubfolderIndex: true,
      },
      pages: [
        { path: "/" },
        { path: "/docs" },
        { path: "/components" },
        { path: "/docs/installation" },
        { path: "/docs/cli" },
        { path: "/docs/mcp" },
        { path: "/docs/accessibility" },
        ...catalog.map((item) => ({ path: `/components/${item.name}` })),
      ],
    }),
    react(),
  ],
});
