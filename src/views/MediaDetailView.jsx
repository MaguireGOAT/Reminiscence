import { ChevronLeft, Library as LibraryIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../components/EmptyState.jsx";
import { MediaCard } from "../components/MediaCard.jsx";
import { QuestionOverlay } from "../components/QuestionOverlay.jsx";
import { useStore } from "../lib/store.jsx";

export function MediaDetailView({ mediaId, navigate }) {
  const { mediaById } = useStore();
  const item = mediaById.get(mediaId);
  const [overlay, setOverlay] = useState(false);

  if (!item) {
    return (
      <div className="page">
        <EmptyState
          icon={LibraryIcon}
          title="找不到這個內容"
          description="內容可能已被刪除。"
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate("/library")}>
              返回資料庫
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <button className="back-link" type="button" onClick={() => navigate("/library")}>
            <ChevronLeft size={18} aria-hidden="true" />
            內容資料庫
          </button>
          <h1 className="page-title">{item.title}</h1>
          <p className="page-subtitle">
            {item.year || item.decade || "年代不詳"} · {item.place} · {item.theme}
          </p>
        </div>
      </header>

      <MediaCard
        item={item}
        mode="detail"
        onOpenQuestions={() => setOverlay(true)}
      />

      {overlay ? (
        <QuestionOverlay item={item} onClose={() => setOverlay(false)} />
      ) : null}
    </div>
  );
}
