import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Footer, Header } from "../components/shell";
import stylesheet from "../theme.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      { rel: "stylesheet", href: stylesheet },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: Shell,
  component: () => (
    <>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  ),
  notFoundComponent: () => (
    <section className="not-found container">
      <h1>Page not found.</h1>
      <p>That component might still be an idea.</p>
      <Link to="/" className="button">
        Back home
      </Link>
    </section>
  ),
  errorComponent: ({ reset }) => (
    <section className="not-found container">
      <h1>Something didn’t settle.</h1>
      <p>Please reload or try again.</p>
      <button type="button" className="button" onClick={reset}>
        Try again
      </button>
    </section>
  ),
});

function Shell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
