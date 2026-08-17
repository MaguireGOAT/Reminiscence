import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, IconButton } from "../components/Button.jsx";
import { MediaThumb } from "../components/MediaThumb.jsx";
import { Modal } from "../components/Modal.jsx";
import { PHASES, THEMES } from "../data/starter.js";
import { useStore } from "../lib/store.jsx";

const emptyPlan = () => ({
  id: `plan-${Date.now()}`,
  title: "新活動計劃",
  theme: THEMES[0],
  minutes: 30,
  updatedAt: new Date().toISOString().slice(0, 10),
  phases: PHASES.map((phase) => ({
    phaseId: phase.id,
    label: phase.label,
    mediaIds: []
  }))
});

export function PlanBuilderView({ planId, navigate }) {
  const { plans, library, savePlan, deletePlan } = useStore();
  const existing = planId ? plans.find((plan) => plan.id === planId) : null;
  const [draft, setDraft] = useState(() =>
    existing ? JSON.parse(JSON.stringify(existing)) : emptyPlan()
  );
  const [pickerPhase, setPickerPhase] = useState(null);
  const [pickerFilter, setPickerFilter] = useState("");

  useEffect(() => {
    if (existing) {
      setDraft(JSON.parse(JSON.stringify(existing)));
    }
  }, [planId, existing]);

  const cardsInPlan = useMemo(
    () => draft.phases.reduce((sum, phase) => sum + (phase.mediaIds?.length || 0), 0),
    [draft.phases]
  );

  const pickerItems = useMemo(() => {
    const filter = pickerFilter.trim();
    return library.filter((item) => !filter || item.title.includes(filter));
  }, [library, pickerFilter]);

  const movePhase = (index, dir) => {
    setDraft((d) => {
      const phases = [...d.phases];
      const target = index + dir;
      if (target < 0 || target >= phases.length) return d;
      [phases[index], phases[target]] = [phases[target], phases[index]];
      return { ...d, phases };
    });
  };

  const moveMedia = (phaseIndex, mediaIndex, dir) => {
    setDraft((d) => {
      const phases = d.phases.map((phase) => ({ ...phase, mediaIds: [...phase.mediaIds] }));
      const ids = phases[phaseIndex].mediaIds;
      const target = mediaIndex + dir;
      if (target < 0 || target >= ids.length) return d;
      [ids[mediaIndex], ids[target]] = [ids[target], ids[mediaIndex]];
      return { ...d, phases };
    });
  };

  const addMedia = (itemId) => {
    if (!pickerPhase) return;
    setDraft((d) => ({
      ...d,
      phases: d.phases.map((phase) =>
        phase.phaseId === pickerPhase.phaseId
          ? { ...phase, mediaIds: [...phase.mediaIds, itemId] }
          : phase
      )
    }));
    setPickerPhase(null);
  };

  const removeMedia = (phaseId, mediaId) => {
    setDraft((d) => ({
      ...d,
      phases: d.phases.map((phase) =>
        phase.phaseId === phaseId
          ? { ...phase, mediaIds: phase.mediaIds.filter((id) => id !== mediaId) }
          : phase
      )
    }));
  };

  const save = () => {
    const finalPlan = { ...draft, updatedAt: new Date().toISOString().slice(0, 10) };
    savePlan(finalPlan);
    navigate("/plans");
  };

  const start = () => {
    savePlan({ ...draft, updatedAt: new Date().toISOString().slice(0, 10) });
    navigate(`/player/${draft.id}`);
  };

  const removePlan = () => {
    if (planId && window.confirm("刪除這個活動計劃？")) {
      deletePlan(planId);
      navigate("/plans");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <button className="back-link" type="button" onClick={() => navigate("/plans")}>
            <ChevronLeft size={18} aria-hidden="true" />
            活動計劃
          </button>
          <h1 className="page-title">編輯計劃</h1>
          <p className="page-subtitle">{cardsInPlan} 張卡 · 共 30 分鐘</p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" icon={Save} onClick={save}>
            儲存
          </Button>
          <Button variant="primary" onClick={start}>
            開始小組
          </Button>
        </div>
      </header>

      <section className="plan-settings panel panel-pad">
        <div className="form-grid">
          <label className="form-field">
            <span className="field-label">計劃名稱</span>
            <input
              className="input"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span className="field-label">主題</span>
            <select
              className="select"
              value={draft.theme}
              onChange={(event) => setDraft({ ...draft, theme: event.target.value })}
            >
              {THEMES.map((theme) => (
                <option key={theme}>{theme}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="builder-section">
        <div className="section-head">
          <h2>階段</h2>
        </div>
        <div className="phase-editor">
          {draft.phases.map((phase, phaseIndex) => (
            <article className="phase-editor-block" key={phase.phaseId}>
              <header className="phase-editor-head">
                <div className="phase-editor-title">
                  <span>{String(phaseIndex + 1).padStart(2, "0")}</span>
                  <h3>{phase.label}</h3>
                </div>
                <div className="phase-editor-actions">
                  <IconButton
                    icon={ArrowUp}
                    label="上移"
                    className="icon-btn-sm"
                    onClick={() => movePhase(phaseIndex, -1)}
                    disabled={phaseIndex === 0}
                  />
                  <IconButton
                    icon={ArrowDown}
                    label="下移"
                    className="icon-btn-sm"
                    onClick={() => movePhase(phaseIndex, 1)}
                    disabled={phaseIndex === draft.phases.length - 1}
                  />
                </div>
              </header>
              {phase.mediaIds?.length ? (
                <div className="phase-media-list">
                  {phase.mediaIds.map((id, mediaIndex) => {
                    const item = library.find((entry) => entry.id === id);
                    if (!item) return null;
                    return (
                      <div className="phase-media-row" key={id}>
                        <MediaThumb item={item} size="sm" />
                        <div className="phase-media-info">
                          <strong>{item.title}</strong>
                          <span className="muted small">
                            {item.year} {item.place}
                          </span>
                        </div>
                        <div className="phase-media-actions">
                          <IconButton
                            icon={ArrowUp}
                            label="上移"
                            className="icon-btn-sm"
                            onClick={() => moveMedia(phaseIndex, mediaIndex, -1)}
                            disabled={mediaIndex === 0}
                          />
                          <IconButton
                            icon={ArrowDown}
                            label="下移"
                            className="icon-btn-sm"
                            onClick={() => moveMedia(phaseIndex, mediaIndex, 1)}
                            disabled={mediaIndex === phase.mediaIds.length - 1}
                          />
                          <IconButton
                            icon={Trash2}
                            label="移除"
                            className="icon-btn-sm icon-btn-danger"
                            onClick={() => removeMedia(phase.phaseId, id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="phase-empty">這個階段尚未加入內容。</p>
              )}
              <Button variant="quiet" icon={Plus} size="sm" onClick={() => setPickerPhase(phase)}>
                加入內容
              </Button>
            </article>
          ))}
        </div>
      </section>

      {planId ? (
        <div className="builder-danger">
          <Button variant="danger" icon={Trash2} onClick={removePlan}>
            刪除計劃
          </Button>
        </div>
      ) : null}

      {pickerPhase ? (
        <Modal
          title={`加入內容至「${pickerPhase.label}」`}
          subtitle="從資料庫選擇一張卡"
          onClose={() => setPickerPhase(null)}
          width={760}
        >
          <input
            className="input picker-search"
            placeholder="搜尋內容"
            value={pickerFilter}
            onChange={(event) => setPickerFilter(event.target.value)}
          />
          <div className="picker-grid">
            {pickerItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="picker-item"
                onClick={() => addMedia(item.id)}
              >
                <MediaThumb item={item} />
                <strong>{item.title}</strong>
                <span className="muted small">{item.year} {item.place}</span>
              </button>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
