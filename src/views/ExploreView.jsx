import { Compass, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState.jsx";
import { MediaThumb } from "../components/MediaThumb.jsx";
import {
  DECADES,
  MEDIA_TYPE_LABELS,
  PLACES,
  THEMES
} from "../data/starter.js";
import { useStore } from "../lib/store.jsx";

const ALL = "全部";

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

export function ExploreView({ navigate }) {
  const { library } = useStore();
  const [theme, setTheme] = useState(ALL);
  const [decade, setDecade] = useState(ALL);
  const [place, setPlace] = useState(ALL);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return library.filter((item) => {
      const themeMatch = theme === ALL || item.theme === theme;
      const decadeMatch = decade === ALL || item.decade === decade;
      const placeMatch = place === ALL || item.place === place;
      const searchMatch =
        !text ||
        [item.title, item.caption, item.place, item.theme]
          .join(" ")
          .toLowerCase()
          .includes(text);
      return themeMatch && decadeMatch && placeMatch && searchMatch;
    });
  }, [library, theme, decade, place, query]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">瀏覽資料庫</p>
          <h1 className="page-title">主題瀏覽</h1>
          <p className="page-subtitle">
            按主題、年代和地區篩選，打開媒體卡直接使用。
          </p>
        </div>
      </header>

      <div className="explore-toolbar">
        <div className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋內容"
          />
        </div>
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
        <div className="explore-grid">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="explore-card"
              onClick={() => navigate(`/media/${item.id}`)}
            >
              <MediaThumb item={item} size="md" />
              <span className="explore-card-body">
                <strong>{item.title}</strong>
                <span className="muted small">
                  {MEDIA_TYPE_LABELS[item.type]}
                  {item.decade ? ` · ${item.decade}` : ""}
                  {item.place ? ` · ${item.place}` : ""}
                </span>
                <span className="tag tag-gold">{item.theme}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title="沒有符合的內容"
          description="放寬篩選條件再試。"
        />
      )}
    </div>
  );
}
