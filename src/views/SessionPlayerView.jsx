import { ClipboardList, Home } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ControlBar } from "../components/ControlBar.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { MediaCard } from "../components/MediaCard.jsx";
import { QuestionOverlay } from "../components/QuestionOverlay.jsx";
import { useStore } from "../lib/store.jsx";

export function SessionPlayerView({ planId, navigate }) {
  const { plans, mediaById } = useStore();
  const plan = plans.find((candidate) => candidate.id === planId);
  const [index, setIndex] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [overlay, setOverlay] = useState(null);

  const sequence = useMemo(() => {
    const items = [];
    for (const phase of plan?.phases || []) {
      for (const id of phase.mediaIds || []) {
        const item = mediaById.get(id);
        if (item) {
          items.push({ ...phase, item });
        }
      }
    }
    return items;
  }, [plan, mediaById]);

  const current = sequence[Math.min(index, Math.max(sequence.length - 1, 0))];

  useEffect(() => {
    setIndex(0);
    setRepeat(false);
    setOverlay(null);
  }, [planId]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "ArrowLeft") {
        setIndex((value) => Math.max(0, value - 1));
      } else if (event.key === "ArrowRight") {
        setIndex((value) => Math.min(sequence.length - 1, value + 1));
      } else if (event.key === "Escape") {
        setOverlay(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sequence.length]);

  if (!plan) {
    return (
      <div className="page">
        <EmptyState
          icon={ClipboardList}
          title="找不到這個活動計劃"
          description="計劃可能已被刪除。"
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate("/plans")}>
              返回活動計劃
            </button>
          }
        />
      </div>
    );
  }

  if (!sequence.length) {
    return (
      <div className="page">
        <EmptyState
          icon={ClipboardList}
          title="這個計劃尚未加入內容"
          description="先到計劃編輯頁加入內容，再開始小組。"
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/plans/${plan.id}`)}
            >
              編輯計劃
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="player-page">
      <header className="player-header">
        <button type="button" className="player-home" onClick={() => navigate("/")}>
          <Home size={19} aria-hidden="true" />
          <span>首頁</span>
        </button>
        <div className="player-header-title">
          <strong>{plan.title}</strong>
          {current ? <span>{current.label}</span> : null}
        </div>
        <div className="player-position">
          第 {index + 1} / {sequence.length} 張
        </div>
      </header>

      <div className="player-stage">
        {current ? (
          <MediaCard
            item={current.item}
            mode="full"
            repeat={repeat}
            onOpenQuestions={() => setOverlay({ reveal: false })}
          />
        ) : null}
      </div>

      <ControlBar
        onBack={() => setIndex((value) => Math.max(0, value - 1))}
        onNext={() => setIndex((value) => Math.min(sequence.length - 1, value + 1))}
        onHome={() => navigate("/")}
        onRepeat={() => setRepeat((value) => !value)}
        repeat={repeat}
        onReveal={() => setOverlay({ reveal: true })}
        hasPrev={index > 0}
        hasNext={index < sequence.length - 1}
        canRepeat={current?.item.type === "song"}
      />

      {overlay && current ? (
        <QuestionOverlay
          item={current.item}
          initialTab="recall"
          initialReveal={overlay.reveal}
          onClose={() => setOverlay(null)}
        />
      ) : null}
    </div>
  );
}
