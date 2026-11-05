import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LibraryNav } from "../components/library-nav";
import { HighlightProvider, loadDocsHighlights } from "../lib/highlights";

export const Route = createFileRoute("/docs")({
  loader: loadDocsHighlights,
  component: Documentation,
});

function Documentation() {
  return (
    <HighlightProvider highlights={Route.useLoaderData()}>
      <div className="library-layout container">
        <LibraryNav />
        <article className="documentation">
          <Outlet />
        </article>
      </div>
    </HighlightProvider>
  );
}
