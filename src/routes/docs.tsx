import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DocsNav } from "../components/docs-nav";
import { HighlightProvider, loadDocsHighlights } from "../lib/highlights";

export const Route = createFileRoute("/docs")({
  loader: loadDocsHighlights,
  component: Documentation,
});

function Documentation() {
  return (
    <HighlightProvider highlights={Route.useLoaderData()}>
      <div className="docs-layout container">
        <DocsNav />
        <article className="documentation">
          <Outlet />
        </article>
      </div>
    </HighlightProvider>
  );
}
