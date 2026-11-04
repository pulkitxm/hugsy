import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hugsy-theme") === "dark";
      document.documentElement.dataset["theme"] = saved ? "dark" : "light";
      setDark(saved);
    } catch {
      document.documentElement.dataset["theme"] = "light";
    }
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset["theme"] = next ? "dark" : "light";
    try {
      localStorage.setItem("hugsy-theme", next ? "dark" : "light");
    } catch {
      return;
    }
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="wordmark" aria-label="Hugsy home">
          hugsy<span>.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/components/">Components</Link>
          <Link to="/docs/">Documentation</Link>
          <a href="https://github.com/pulkitxm/hugsy" className="github-link">
            GitHub
            <ArrowUpRight size={13} />
          </a>
        </nav>
        <button
          className="icon-button theme-toggle"
          type="button"
          aria-label="Toggle color theme"
          aria-pressed={dark}
          onClick={toggleTheme}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link to="/" className="wordmark">
          hugsy.
        </Link>
        <p>SwiftUI components. Yours to make.</p>
        <div>
          <a href="https://github.com/pulkitxm/hugsy">GitHub</a>
          <a href="https://github.com/pulkitxm/hugsy/blob/main/LICENSE">MIT License</a>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
