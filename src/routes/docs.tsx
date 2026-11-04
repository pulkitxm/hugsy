import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LibrarySidebar } from "../components/library-sidebar";

export const Route = createFileRoute("/docs")({
  component: () => (
    <div className="library-layout container">
      <LibrarySidebar />
      <article className="documentation">
        <Outlet />
      </article>
    </div>
  ),
});
