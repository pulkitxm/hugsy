import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { showcase } from "../../registry/catalog";
import { ComponentCard } from "../components/component-card";
import { LibrarySidebar } from "../components/library-sidebar";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/components/")({
  head: () =>
    seo(
      "Components",
      "A focused collection of animated iOS components for SwiftUI and UIKit. Inspect the Swift source and adopt only what your app needs.",
      "/components/",
    ),
  component: Components,
});

function Components() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const categories = ["All", ...new Set(showcase.map((item) => item.category))];
  const visible = showcase.filter(
    (item) =>
      (category === "All" || category === item.category) &&
      `${item.title} ${item.description} ${item.technique}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="library-layout container">
      <LibrarySidebar />
      <div className="library-content">
        <div className="page-heading">
          <p className="overline">The collection</p>
          <h1>Components</h1>
          <p>Native interactions, with the difficult parts already considered.</p>
        </div>
        <div className="collection-tools">
          <label className="search-field">
            <Search size={16} />
            <input
              type="search"
              aria-label="Search components"
              placeholder="Search components…"
              value={query}
              disabled={!ready}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={14} />
              </button>
            )}
          </label>
          <fieldset className="collection-filters" disabled={!ready}>
            <legend className="sr-only">Filter by category</legend>
            {categories.map((name) => (
              <button
                type="button"
                key={name}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </fieldset>
        </div>
        <p className="results-count" aria-live="polite">
          {visible.length} components
        </p>
        <div className="components-grid">
          {visible.map((item) => (
            <ComponentCard key={item.name} {...item} />
          ))}
        </div>
        {visible.length === 0 && (
          <div className="empty-state">
            <h2>No components found.</h2>
            <p>Try a different name or animation technique.</p>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
