import { Link, useLocation } from "@tanstack/react-router";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { themeStorageKey } from "../lib/theme";

export function Header() {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset["theme"] === "dark" ? "light" : "dark";
    root.dataset["theme"] = next;
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      return;
    }
  }
  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link to="/" className="wordmark" aria-label="Hugsy home">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="16" />
            <path d="M20 16v32m0-13c0-15 24-15 24 0v13" />
          </svg>
          hugsy
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/docs/">Docs</Link>
          <Link to="/components/">Components</Link>
        </nav>
        <a href="https://github.com/pulkitxm/hugsy" className="icon-button github-link">
          <span className="sr-only">Hugsy on GitHub</span>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </a>
        <button
          className="icon-button"
          type="button"
          aria-label="Toggle color theme"
          onClick={toggleTheme}
        >
          <Sun className="theme-sun" aria-hidden="true" />
          <Moon className="theme-moon" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  const { pathname } = useLocation();
  const markdown = pathname === "/" ? "/index.md" : `${pathname.replace(/\/$/, "")}.md`;
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <span>Animated iOS components for SwiftUI and UIKit.</span>
        <nav aria-label="Footer">
          <a href={markdown} className="markdown-link" aria-label="View this page as Markdown">
            .md
          </a>
          <a href="https://github.com/pulkitxm/hugsy">
            GitHub <ArrowUpRight size={12} aria-hidden="true" />
          </a>
          <a href="https://github.com/pulkitxm/hugsy/blob/main/LICENSE">MIT License</a>
        </nav>
      </div>
    </footer>
  );
}
