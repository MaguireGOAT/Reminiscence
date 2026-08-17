import {
  CalendarDays,
  ClipboardList,
  Compass,
  Home,
  Library as LibraryIcon
} from "lucide-react";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "首頁", icon: Home },
  { path: "/plans", label: "活動計劃", icon: ClipboardList },
  { path: "/library", label: "資料庫", icon: LibraryIcon },
  { path: "/explore", label: "瀏覽", icon: Compass },
  { path: "/logs", label: "小組紀錄", icon: CalendarDays }
];

const todayText = new Intl.DateTimeFormat("zh-Hant-HK", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long"
}).format(new Date());

export function AppShell({ route, navigate, children }) {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
  }, []);

  const activeFor = (path) =>
    route.path === path || (path !== "/" && route.path.startsWith(path));

  if (route.path.startsWith("/player")) {
    return <div className="standalone-route">{children}</div>;
  }

  return (
    <div className="app-shell">
      <aside className="side-nav" aria-label="主要導覽">
        <button className="brand" type="button" onClick={() => navigate("/")}>
          <span className="brand-mark">憶</span>
          <span className="brand-text">
            <strong>憶當年</strong>
            <small>院舍小組回憶活動</small>
          </span>
        </button>
        <nav className="side-nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-link ${activeFor(item.path) ? "nav-link-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={19} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-nav-foot">
          <p>{todayText}</p>
          {installed ? <span className="tag tag-jade">已安裝</span> : null}
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button
            className="brand brand-topbar"
            type="button"
            onClick={() => navigate("/")}
          >
            <span className="brand-mark">憶</span>
            <strong>憶當年</strong>
          </button>
          <p className="topbar-date">{todayText}</p>
        </header>
        <main>{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="主要導覽">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`bottom-nav-item ${activeFor(item.path) ? "bottom-nav-active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon size={21} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
