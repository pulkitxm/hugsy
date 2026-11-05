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
      <div className="header-inner container">
        <Link to="/" className="wordmark" aria-label="Hugsy home">
          hugsy
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/components/">Components</Link>
          <Link to="/docs/">Docs</Link>
          <a href="https://github.com/pulkitxm/hugsy" className="github-link">
            GitHub
          </a>
        </nav>
        <button
          className="icon-button"
          type="button"
          aria-label="Toggle color theme"
          aria-pressed={dark}
          onClick={toggleTheme}
        >
          {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <span>Animated iOS components for SwiftUI and UIKit.</span>
        <nav aria-label="Footer">
          <a href="https://github.com/pulkitxm/hugsy">
            GitHub <ArrowUpRight size={12} aria-hidden="true" />
          </a>
          <a href="https://github.com/pulkitxm/hugsy/blob/main/LICENSE">MIT License</a>
        </nav>
      </div>
    </footer>
  );
}
