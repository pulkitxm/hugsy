import { Link } from "@tanstack/react-router";
import { ArrowUpRight, GitFork, Moon, Sun } from "lucide-react";
import { useState } from "react";

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

export function Header() {
  const [dark, setDark] = useState(false);
  function toggleTheme() {
    const current =
      document.documentElement.dataset["theme"] ??
      (globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset["theme"] = next;
    setDark(next === "dark");
  }
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="Hugsy home">
          <Mark />
          hugsy<span className="brand-period">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/" hash="components">
            Components<span className="nav-count">06</span>
          </Link>
          <Link to="/docs/">Documentation</Link>
        </nav>
        <div className="header-actions">
          <a href="https://github.com/pulkitxm/hugsy" className="github-link">
            <GitFork size={17} />
            GitHub
            <ArrowUpRight size={13} />
          </a>
          <span className="header-divider" />
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link to="/" className="brand">
          <Mark />
          hugsy.
        </Link>
        <p>A little more feeling. A lot less rebuilding.</p>
      </div>
      <div className="footer-right">
        <span>Made for the Mac. Yours to make.</span>
        <a href="https://github.com/pulkitxm/hugsy/blob/main/LICENSE">
          MIT License <ArrowUpRight size={12} />
        </a>
        <span className="mono">© 2026 HUGSY</span>
      </div>
    </footer>
  );
}
