import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  ChevronDown,
  Command,
  File,
  Folder,
  Heart,
  Inbox,
  Layers,
  Mail,
  Music,
  Plus,
  Search,
  Settings,
  Sidebar,
  Sparkles,
  X,
} from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useId, useRef, useState } from "react";

const commands = [
  {
    id: "project",
    title: "Create a new project",
    detail: "Start something good",
    icon: Plus,
    shortcut: "N",
  },
  {
    id: "files",
    title: "Go to files",
    detail: "Everything in its place",
    icon: Folder,
    shortcut: "F",
  },
  {
    id: "theme",
    title: "Change appearance",
    detail: "A different point of view",
    icon: Sparkles,
    shortcut: "T",
  },
  {
    id: "settings",
    title: "Open settings",
    detail: "Make yourself at home",
    icon: Settings,
    shortcut: ",",
  },
];

function Palette({ onSelect }: { onSelect: (title: string) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const filtered = commands.filter((command) =>
    command.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="palette">
      <div className="palette-search">
        <Search size={18} />
        <input
          aria-label="Search commands"
          placeholder="What would you like to do?"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) =>
                Math.min(
                  Math.max(value + (event.key === "ArrowDown" ? 1 : -1), 0),
                  Math.max(0, filtered.length - 1),
                ),
              );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const item = filtered[active];
              if (item) {
                onSelect(item.title);
              }
            }
          }}
          aria-describedby={`${id}-help`}
        />
        <kbd>⌘ K</kbd>
      </div>
      <p className="palette-label">SUGGESTED COMMANDS</p>
      <div className="palette-results">
        {filtered.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`palette-item ${active === index ? "is-active" : ""}`}
            onFocus={() => setActive(index)}
            onPointerEnter={() => setActive(index)}
            onClick={() => onSelect(item.title)}
          >
            <span className="command-icon">
              <item.icon size={17} />
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
            <kbd>{item.shortcut}</kbd>
          </button>
        ))}
        {filtered.length === 0 && <p className="empty-results">No commands found. Try “files”.</p>}
      </div>
      <div className="palette-footer" id={`${id}-help`}>
        <span>
          <kbd>
            <ArrowUp size={10} />
          </kbd>
          <kbd>
            <ArrowDown size={10} />
          </kbd>{" "}
          to navigate
        </span>
        <span>
          <kbd>↵</kbd> to select
        </span>
      </div>
    </div>
  );
}

export function CommandDemo({ hero = false }: { hero?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("Your next good idea starts here.");
  function select(title: string) {
    setStatus(`${title}: done`);
    dialog.current?.close();
  }
  return (
    <div className={`command-demo ${hero ? "hero-command" : ""}`}>
      <div className="window-chrome">
        <div className="traffic-lights">
          <i />
          <i />
          <i />
        </div>
        <span>Workspace</span>
        <Sidebar size={13} />
      </div>
      <div className="window-body">
        <div className="window-rail">
          <Layers size={17} />
          <Inbox size={17} />
          <Folder size={17} />
          <Settings size={17} />
        </div>
        <div className="window-content">
          <div className="window-title">
            A space for your next idea
            <span className="dot" />
          </div>
          <Palette onSelect={select} />
          <div className="window-status">
            <span aria-live="polite">{status}</span>
            <button
              type="button"
              onClick={() => dialog.current?.showModal()}
              aria-label="Open command palette"
            >
              <Command size={12} /> Open
            </button>
          </div>
        </div>
      </div>
      <dialog ref={dialog} className="demo-dialog" aria-label="Command palette">
        <div className="dialog-topline">
          <span>COMMAND PALETTE</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Close command palette"
            onClick={() => dialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        <Palette onSelect={select} />
      </dialog>
    </div>
  );
}

type Toast = { id: number; title: string; detail: string };
function ToastRow({ item, onDismiss }: { item: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (item.id < 3) {
      return;
    }
    const timer = globalThis.setTimeout(() => onDismiss(item.id), 5000);
    return () => globalThis.clearTimeout(timer);
  }, [item, onDismiss]);
  return (
    <div className="toast-row">
      <span className="toast-check">
        <Check size={15} />
      </span>
      <div>
        <strong>{item.title}</strong>
        <small>{item.detail}</small>
      </div>
      <button type="button" aria-label={`Dismiss ${item.title}`} onClick={() => onDismiss(item.id)}>
        <X size={13} />
      </button>
    </div>
  );
}

function ToastDemo() {
  const counter = useRef(2);
  const [items, setItems] = useState<Toast[]>([
    { id: 2, title: "Everything is up to date", detail: "Your workspace is in sync." },
    { id: 1, title: "Project created", detail: "Good things start small." },
  ]);
  const dismiss = useCallback(
    (id: number) => setItems((previous) => previous.filter((item) => item.id !== id)),
    [],
  );
  return (
    <div className="toast-demo">
      <div className="toast-stage" aria-live="polite">
        {items.length === 0 && (
          <span className="demo-empty">
            <Bell size={25} />
            All caught up.
          </span>
        )}
        {items.map((item) => (
          <ToastRow key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
      <button
        type="button"
        className="demo-action"
        onClick={() => {
          counter.current += 1;
          const id = counter.current;
          setItems((previous) =>
            [
              { id, title: `Changes saved · ${id - 2}`, detail: "Looking good. Keep going." },
              ...previous,
            ].slice(0, 4),
          );
        }}
      >
        <Plus size={13} />
        Show a toast
      </button>
    </div>
  );
}

function FluidTabsDemo() {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = ["Overview", "Activity", "Settings"];
  return (
    <div className="tabs-demo">
      <div className="fluid-tabs" role="tablist" aria-label="Project views">
        <span className="tab-pill" style={{ transform: `translateX(${active * 100}%)` }} />
        {tabs.map((tab, index) => (
          <button
            type="button"
            key={tab}
            role="tab"
            id={`${id}-${index}`}
            aria-controls={`${id}-panel`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              let next = active;
              if (event.key === "ArrowRight") {
                next = (active + 1) % tabs.length;
              } else if (event.key === "ArrowLeft") {
                next = (active + tabs.length - 1) % tabs.length;
              } else if (event.key === "Home") {
                next = 0;
              } else if (event.key === "End") {
                next = tabs.length - 1;
              } else {
                return;
              }
              event.preventDefault();
              setActive(next);
              document.getElementById(`${id}-${next}`)?.focus();
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        className="tab-content"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${active}`}
        key={active}
      >
        {active === 0 && (
          <>
            <span className="tab-visual">
              <Layers size={23} />
            </span>
            <strong>A place for everything.</strong>
            <p>Your projects, with a little perspective.</p>
            <div className="mini-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </>
        )}
        {active === 1 && (
          <>
            <span className="tab-visual">
              <Sparkles size={23} />
            </span>
            <strong>Good things are happening.</strong>
            <p>3 updates to your workspace today.</p>
            <div className="activity-dots">
              <i />
              <span>Design system updated</span>
              <Check size={14} />
            </div>
          </>
        )}
        {active === 2 && (
          <>
            <span className="tab-visual">
              <Settings size={23} />
            </span>
            <strong>Just the way you like it.</strong>
            <p>Small details make it yours.</p>
            <label className="demo-switch">
              Desktop notifications
              <input type="checkbox" defaultChecked />
            </label>
          </>
        )}
      </div>
    </div>
  );
}

const dockItems = [
  { name: "Files", icon: Folder, color: "blue" },
  { name: "Messages", icon: Mail, color: "green" },
  { name: "Music", icon: Music, color: "pink" },
  { name: "Notes", icon: File, color: "yellow" },
  { name: "Favorites", icon: Heart, color: "purple" },
];
function DockDemo() {
  const [active, setActive] = useState<number | null>(null);
  const [opened, setOpened] = useState("A familiar feeling. A fresh implementation.");
  return (
    <div className="dock-demo">
      <span className="dock-caption">YOUR LITTLE LAUNCHPAD</span>
      <div className="dock-shelf">
        {dockItems.map((item, index) => {
          const distance = active === null ? 3 : Math.abs(active - index);
          const dimensions: CSSProperties & Record<"--dock-size", string> = {
            "--dock-size": `${Math.max(42, 64 - distance * 11)}px`,
          };
          return (
            <button
              className={`dock-item dock-${item.color}`}
              type="button"
              key={item.name}
              style={dimensions}
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onClick={() => setOpened(`${item.name} opened`)}
              aria-label={`Open ${item.name}`}
            >
              <item.icon size={25} />
              <span className="dock-tooltip">{item.name}</span>
            </button>
          );
        })}
      </div>
      <p className="dock-status" aria-live="polite">
        {opened}
      </p>
      <span className="demo-hint">HOVER, FOCUS, OR CLICK</span>
    </div>
  );
}

const cards = [
  {
    title: "Make room for\nsomething good.",
    label: "A LITTLE INSPIRATION",
    color: "peach",
    number: "01",
  },
  { title: "Ideas are better\nin motion.", label: "KEEP EXPLORING", color: "lilac", number: "02" },
  { title: "The next thing\nis your thing.", label: "MAKE IT YOURS", color: "sage", number: "03" },
];
function CardStackDemo() {
  const [position, setPosition] = useState(0);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const advance = () => {
    setPosition((value) => (value + 1) % cards.length);
    setDrag(0);
  };
  return (
    <div className="cards-demo">
      <div
        className="card-stack"
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          start.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (start.current !== null) {
            setDrag(event.clientX - start.current);
          }
        }}
        onPointerUp={(event) => {
          if (start.current !== null && Math.abs(event.clientX - start.current) > 60) {
            advance();
          }
          start.current = null;
          setDrag(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDrag(0);
        }}
      >
        {cards.map((card, index) => {
          const depth = (index - position + cards.length) % cards.length;
          return (
            <div
              className={`stack-card card-${card.color}`}
              key={card.number}
              aria-hidden={depth !== 0}
              style={{
                transform: `translate(${depth === 0 ? drag : 0}px, ${depth * 11}px) scale(${1 - depth * 0.05}) rotate(${depth === 0 ? drag / 22 : 0}deg)`,
                zIndex: 3 - depth,
              }}
            >
              <span>{card.label}</span>
              <strong>{card.title}</strong>
              <div className="card-bottom">
                <span>HUGSY STUDIO</span>
                <span>{card.number} / 03</span>
              </div>
              <span className="card-orbit" aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <div className="cards-controls">
        <span className="demo-hint">DRAG TO EXPLORE</span>
        <button type="button" onClick={advance} aria-label="Next card">
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

const destinations = [
  { name: "Inbox", icon: Inbox, count: "8" },
  { name: "Projects", icon: Layers, count: "3" },
  { name: "Favorites", icon: Heart, count: "" },
  { name: "Archive", icon: Archive, count: "" },
];
function SidebarDemo() {
  const [expanded, setExpanded] = useState(true);
  const [selection, setSelection] = useState("Inbox");
  return (
    <div className="sidebar-demo">
      <div className={`animated-sidebar ${expanded ? "expanded" : "collapsed"}`}>
        <div className="sidebar-header">
          <span className="workspace-avatar">S</span>
          {expanded && (
            <strong>
              Studio workspace
              <ChevronDown size={10} />
            </strong>
          )}
          <button
            type="button"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setExpanded((value) => !value)}
          >
            <Sidebar size={14} />
          </button>
        </div>
        <span className="sidebar-section">{expanded ? "WORKSPACE" : "···"}</span>
        <div className="sidebar-links">
          {destinations.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() => setSelection(item.name)}
              className={selection === item.name ? "selected" : ""}
              aria-label={item.name}
              aria-pressed={selection === item.name}
            >
              <item.icon size={16} />
              {expanded && (
                <>
                  <span>{item.name}</span>
                  <small>{item.count}</small>
                </>
              )}
            </button>
          ))}
        </div>
        <div className="sidebar-profile">
          <span className="profile-avatar">JD</span>
          {expanded && (
            <span>
              Jamie Davis<small>Personal account</small>
            </span>
          )}
          <span className="online-dot" />
        </div>
      </div>
      <div className="sidebar-page">
        <span className="sidebar-page-icon">
          <Folder size={25} />
        </span>
        <strong aria-live="polite">{selection}</strong>
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export function ComponentDemo({ name }: { name: string }) {
  switch (name) {
    case "command-palette":
      return <CommandDemo />;
    case "toast-stack":
      return <ToastDemo />;
    case "fluid-tabs":
      return <FluidTabsDemo />;
    case "magnifying-dock":
      return <DockDemo />;
    case "card-stack":
      return <CardStackDemo />;
    case "animated-sidebar":
      return <SidebarDemo />;
    default:
      return <p>Demo not found.</p>;
  }
}
