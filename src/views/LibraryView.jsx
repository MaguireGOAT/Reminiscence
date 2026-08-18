import {
  ExternalLink,
  LayoutGrid,
  Library as LibraryIcon,
  List,
  Search,
  Settings2
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { MediaThumb } from "../components/MediaThumb.jsx";
import {
  DECADES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  PLACES,
  THEMES
} from "../data/starter.js";
import { useStore } from "../lib/store.jsx";

const ALL = "全部";
const VIEW_KEY = "reminiscence-library-view";
const SORT_KEY = "reminiscence-library-sort";
const TYPE_ORDER = ["song", "photo", "video", "text"];

const SORT_OPTIONS = [
  { value: "recent", label: "最近上載" },
  { value: "theme", label: "主題" },
  { value: "type", label: "類型" },
  { value: "year", label: "年代" }
];

function readPref(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function decadeNumber(item) {
  const text = `${item.year || ""} ${item.decade || ""}`;
  const match = text.match(/(18|19|20)\d{2}/);
  return match ? Number(match[0]) : Infinity;
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="filter-group">
      <span className="filter-label">{label}</span>
      <div className="chip-row">
        {[ALL, ...options].map((option) => (
          <button
            key={option}
            type="button"
            className={`chip ${value === option ? "chip-active" : ""}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LibraryView({ navigate }) {
  const { library } = useStore();
  const [view, setView] = useState(() => readPref(VIEW_KEY, "grid"));
  const [sort, setSort] = useState(() => readPref(SORT_KEY, "recent"));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(ALL);
  const [theme, setTheme] = useState(ALL);
  const [decade, setDecade] = useState(ALL);
  const [place, setPlace] = useState(ALL);

  const changeView = (next) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };

  const changeSort = (next) => {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  };

  const goAdmin = () => navigate("/admin");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const items = library.filter((item) => {
      const typeMatch = filter === ALL || item.type === filter;
      const themeMatch = theme === ALL || item.theme === theme;
      const decadeMatch = decade === ALL || item.decade === decade;
      const placeMatch = place === ALL || item.place === place;
      const searchMatch =
        !text ||
        [item.title, item.caption, item.place, item.theme, item.year]
          .join(" ")
          .toLowerCase()
          .includes(text);
      return typeMatch && themeMatch && decadeMatch && placeMatch && searchMatch;
    });
    const sorted = [...items].sort((a, b) => {
      if (sort === "theme") return a.theme.localeCompare(b.theme, "zh-Hant-HK");
      if (sort === "type") return TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
      if (sort === "year") return decadeNumber(a) - decadeNumber(b);
      return 0;
    });
    if (sort === "recent") sorted.reverse();
    return sorted;
  }, [library, query, filter, theme, decade, place, sort]);

  const openMedia = (id) => navigate(`/media/${id}`);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">內容資料庫</p>
          <h1 className="page-title">內容資料庫</h1>
          <p className="page-subtitle">{library.length} 個內容項目</p>
        </div>
        <div className="page-actions">
          <Button variant="quiet" icon={Settings2} onClick={goAdmin}>
            管理內容
          </Button>
        </div>
      </header>

      <div className="library-toolbar">
        <div className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋標題、地區或主題"
          />
        </div>
        <label className="sort-select">
          <span>排序</span>
          <select value={sort} onChange={(event) => changeSort(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className="view-toggle" role="group" aria-label="顯示方式">
          <button
            type="button"
            className={`view-toggle-btn ${view === "grid" ? "view-toggle-active" : ""}`}
            onClick={() => changeView("grid")}
            aria-label="網格顯示"
          >
            <LayoutGrid size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${view === "list" ? "view-toggle-active" : ""}`}
            onClick={() => changeView("list")}
            aria-label="列表顯示"
          >
            <List size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="type-tabs" role="tablist" aria-label="內容類型">
        {[ALL, ...MEDIA_TYPES].map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={filter === type}
            className={`chip ${filter === type ? "chip-active" : ""}`}
            onClick={() => setFilter(type)}
          >
            {type === ALL ? ALL : MEDIA_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="filter-panel">
        <FilterGroup label="主題" options={THEMES} value={theme} onChange={setTheme} />
        <FilterGroup label="年代" options={DECADES} value={decade} onChange={setDecade} />
        <FilterGroup label="地區" options={PLACES} value={place} onChange={setPlace} />
      </div>

      <div className="explore-count">
        <strong>{filtered.length}</strong>
        <span>個內容項目</span>
      </div>

      {filtered.length ? (
        view === "grid" ? (
          <div className="explore-grid">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className="explore-card"
                onClick={() => openMedia(item.id)}
              >
                <MediaThumb item={item} size="md" />
                <span className="explore-card-body">
                  <strong>{item.title}</strong>
                  <span className="muted small">
                    {MEDIA_TYPE_LABELS[item.type]}
                    {item.year || item.decade ? ` · ${item.year || item.decade}` : ""}
                    {item.place ? ` · ${item.place}` : ""}
                  </span>
                  <span className="tag tag-gold">{item.theme}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="library-list">
            {filtered.map((item) => (
              <article className="library-row" key={item.id}>
                <MediaThumb item={item} size="sm" />
                <div className="library-row-main">
                  <div className="library-row-title">
                    <strong>{item.title}</strong>
                    <span className="tag">{MEDIA_TYPE_LABELS[item.type]}</span>
                    {item.theme ? <span className="tag">{item.theme}</span> : null}
                    {item.year || item.decade ? (
                      <span className="tag tag-gold">{item.year || item.decade}</span>
                    ) : null}
                    {item.place ? <span className="tag">{item.place}</span> : null}
                  </div>
                  {item.caption ? (
                    <p className="muted small library-row-caption">{item.caption}</p>
                  ) : null}
                </div>
                <div className="library-row-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ExternalLink}
                    onClick={() => openMedia(item.id)}
                  >
                    開啟
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={LibraryIcon}
          title={library.length ? "沒有符合的內容" : "尚未加入內容"}
          description={
            library.length
              ? "調整篩選條件再試。"
              : "先到管理頁加入相片、歌曲或影片。"
          }
          action={
            <Button variant="primary" onClick={goAdmin}>
              前往管理內容
            </Button>
          }
        />
      )}
    </div>
  );
}
