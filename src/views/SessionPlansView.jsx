import { ClipboardList, Plus, Play, Download } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { useStore } from "../lib/store.jsx";

export function SessionPlansView({ navigate }) {
  const { plans, prepared } = useStore();

  const totalCards = (plan) =>
    (plan.phases || []).reduce((sum, phase) => sum + (phase.mediaIds?.length || 0), 0);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">活動計劃</p>
          <h1 className="page-title">30 分鐘小組計劃</h1>
          <p className="page-subtitle">
            每個計劃由可重排的階段組成，包含歌曲、相片、影片和文字卡。
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate("/plans/new")}>
          新增計劃
        </Button>
      </header>

      {plans.length ? (
        <div className="plan-list">
          {plans.map((plan) => (
            <article className="plan-card" key={plan.id}>
              <div className="plan-card-main">
                <h2>{plan.title}</h2>
                <div className="plan-card-tags">
                  <span className="tag tag-gold">{plan.theme}</span>
                  <span className="tag">{plan.minutes} 分鐘</span>
                  <span className="tag">{totalCards(plan)} 張卡</span>
                  {prepared.includes(plan.id) ? <span className="tag tag-jade">已準備離線</span> : null}
                </div>
                <div className="phase-strip">
                  {(plan.phases || []).map((phase) => {
                    const count = phase.mediaIds?.length || 0;
                    return (
                      <span className="phase-strip-item" key={phase.phaseId}>
                        {phase.label}
                        {count ? <b>{count}</b> : null}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="plan-card-actions">
                <Button variant="primary" icon={Play} onClick={() => navigate(`/player/${plan.id}`)}>
                  開始
                </Button>
                <Button variant="ghost" icon={Download} onClick={() => navigate(`/plans/${plan.id}`)}>
                  準備 / 編輯
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="未有活動計劃"
          description="建立一個計劃，開始準備小組活動。"
          action={
            <Button variant="primary" icon={Plus} onClick={() => navigate("/plans/new")}>
              新增計劃
            </Button>
          }
        />
      )}
    </div>
  );
}
