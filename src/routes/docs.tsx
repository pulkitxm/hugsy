import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LibrarySidebar } from "../components/library-sidebar";
import { HighlightProvider, loadDocsHighlights } from "../lib/highlights";

export const Route = createFileRoute("/docs")({
  loader: loadDocsHighlights,
  component: Documentation,
});

function Documentation() {
  return (
    <HighlightProvider highlights={Route.useLoaderData()}>
      <div className="library-layout container">
        <LibrarySidebar />
        <article className="documentation">
          <Outlet />
        </article>
      </div>
    </HighlightProvider>
  );
}
