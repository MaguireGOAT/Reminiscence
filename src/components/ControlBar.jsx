import { ChevronLeft, ChevronRight, Eye, Home, Repeat } from "lucide-react";

export function ControlBar({
  onBack,
  onNext,
  onHome,
  onRepeat,
  repeat,
  onReveal,
  hasPrev,
  hasNext,
  canRepeat
}) {
  return (
    <div className="control-bar">
      <div className="control-bar-group">
        <button
          type="button"
          className="control-btn"
          onClick={onBack}
          disabled={!hasPrev}
          aria-label="上一個"
        >
          <ChevronLeft size={22} aria-hidden="true" />
          <span>上一個</span>
        </button>
        <button
          type="button"
          className="control-btn"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="下一個"
        >
          <span>下一個</span>
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>
      <div className="control-bar-group control-bar-center">
        {canRepeat ? (
          <button
            type="button"
            className={`control-btn ${repeat ? "control-btn-active" : ""}`}
            onClick={onRepeat}
            aria-pressed={repeat}
            aria-label="重播歌曲"
          >
            <Repeat size={20} aria-hidden="true" />
            <span>重播</span>
          </button>
        ) : null}
        <button
          type="button"
          className="control-btn"
          onClick={onReveal}
          aria-label="顯示答案"
        >
          <Eye size={20} aria-hidden="true" />
          <span>顯示答案</span>
        </button>
      </div>
      <div className="control-bar-group">
        <button type="button" className="control-btn control-btn-home" onClick={onHome} aria-label="首頁">
          <Home size={20} aria-hidden="true" />
          <span>首頁</span>
        </button>
      </div>
    </div>
  );
}
