import {
  CalendarDays,
  Download,
  Play,
  Plus,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button.jsx";
import { MediaThumb } from "../components/MediaThumb.jsx";
import { Modal } from "../components/Modal.jsx";
import { MEDIA_TYPE_LABELS } from "../data/starter.js";
import { prepareSessionOffline, sessionIsPrepared } from "../lib/offline.js";
import { useStore } from "../lib/store.jsx";

export function HomeView({ navigate }) {
  const { library, plans, logs, mediaById, prepared, setPreparedIds } = useStore();
  const [prepPlanId, setPrepPlanId] = useState(null);
  const [prepProgress, setPrepProgress] = useState(null);
  const [prepDone, setPrepDone] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const counts = useMemo(() => {
    const result = { song: 0, photo: 0, video: 0, text: 0 };
    library.forEach((item) => {
      result[item.type] = (result[item.type] || 0) + 1;
    });
    return result;
  }, [library]);

  const recentLogs = logs.slice(0, 2);
  const prepPlan = prepPlanId ? plans.find((plan) => plan.id === prepPlanId) : null;

  const startPrep = async () => {
    if (!prepPlan) return;
    setPrepProgress({ done: 0, total: 1 });
    setPrepDone(false);
    try {
      const total = await prepareSessionOffline(prepPlan, mediaById, (done, all) => {
        setPrepProgress({ done, total: all });
      });
      setPreparedIds(Array.from(new Set([...prepared, prepPlan.id])));
      setPrepDone(true);
    } catch (error) {
      console.error(error);
      setPrepProgress({ done: 0, total: 1, error: true });
    }
  };

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <div className="page home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">今日小組</p>
          <h1>準備好同組員分享回憶未？</h1>
          <p className="home-hero-lead">
            揀一個活動計劃，或者先準備離線內容，確保小組開始時一切順暢。
          </p>
          <div className="home-hero-actions">
            <Button variant="primary" size="lg" icon={Play} onClick={() => navigate("/plans")}>
              開始小組
            </Button>
            <Button variant="jade" size="lg" icon={Download} onClick={() => setPrepPlanId(plans[0]?.id || null)}>
              準備離線
            </Button>
          </div>
        </div>
        <div className="home-hero-panel">
          <div className="home-hero-panel-head">
            <Sparkles size={18} aria-hidden="true" />
            <span>快速開始</span>
          </div>
          <div className="quick-plan-list">
            {plans.slice(0, 3).map((plan) => (
              <button
                key={plan.id}
                type="button"
                className="quick-plan-row"
                onClick={() => navigate(`/player/${plan.id}`)}
              >
                <span className="quick-plan-icon">
                  <Play size={16} aria-hidden="true" />
                </span>
                <span>
                  <strong>{plan.title}</strong>
                  <small>{plan.minutes} 分鐘</small>
                </span>
                {prepared.includes(plan.id) ? <span className="tag tag-jade">已準備</span> : null}
              </button>
            ))}
          </div>
          <Button variant="quiet" icon={Plus} onClick={() => navigate("/plans/new")}>
            新增活動計劃
          </Button>
        </div>
      </section>

      <section className="home-stats" aria-label="內容統計">
        <div className="stat-block">
          <strong>{counts.song}</strong>
          <span>歌曲</span>
        </div>
        <div className="stat-block">
          <strong>{counts.photo}</strong>
          <span>相片</span>
        </div>
        <div className="stat-block">
          <strong>{counts.video}</strong>
          <span>影片</span>
        </div>
        <div className="stat-block">
          <strong>{counts.text}</strong>
          <span>文字卡</span>
        </div>
        <div className="stat-block stat-block-wide">
          <strong>{prepared.length}</strong>
          <span>已準備離線計劃</span>
        </div>
      </section>

      <div className="home-columns">
        <section className="home-section">
          <div className="section-head">
            <h2>最近活動</h2>
            <Button variant="quiet" size="sm" onClick={() => navigate("/logs")}>
              查看全部
            </Button>
          </div>
          {recentLogs.length ? (
            <div className="recent-list">
              {recentLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  className="recent-row"
                  onClick={() => navigate("/logs")}
                >
                  <span className="recent-date">
                    <CalendarDays size={17} aria-hidden="true" />
                    {log.date}
                  </span>
                  <strong>{log.planTitle || log.theme}</strong>
                  <span className="muted small">
                    出席 {log.attendance} 人 · 投入程度 {log.engagement}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">尚未記錄小組活動。</p>
          )}
        </section>

        <section className="home-section">
          <div className="section-head">
            <h2>常用內容</h2>
            <Button variant="quiet" size="sm" onClick={() => navigate("/library")}>
              資料庫
            </Button>
          </div>
          <div className="home-media-row">
            {library.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                className="home-media-item"
                onClick={() => navigate(`/media/${item.id}`)}
              >
                <MediaThumb item={item} size="sm" />
                <span className="home-media-title">{item.title}</span>
                <span className="muted small">{MEDIA_TYPE_LABELS[item.type]}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {installEvent ? (
        <div className="install-banner">
          <div>
            <strong>將憶當年安裝到裝置</strong>
            <p className="small muted">之後可以像一般應用程式一樣開啟，並離線使用已準備的內容。</p>
          </div>
          <Button variant="primary" onClick={install}>
            安裝
          </Button>
        </div>
      ) : null}

      {prepPlan ? (
        <Modal
          title="準備離線"
          subtitle={prepPlan.title}
          onClose={() => {
            setPrepPlanId(null);
            setPrepProgress(null);
            setPrepDone(false);
          }}
          footer={
            <div className="modal-footer-inner">
              {prepDone ? (
                <Button variant="primary" onClick={() => setPrepPlanId(null)}>
                  完成
                </Button>
              ) : (
                <Button variant="jade" onClick={startPrep} disabled={!!prepProgress}>
                  {prepProgress ? "準備中..." : "開始下載"}
                </Button>
              )}
            </div>
          }
        >
          <p className="muted">
            系統會把這個計劃內所有歌曲、相片、影片和問題下載到裝置，供離線小組使用。
          </p>
          {prepProgress ? (
            <div className="prep-progress">
              <div className="prep-progress-track">
                <span
                  style={{
                    width: `${Math.round((prepProgress.done / prepProgress.total) * 100)}%`
                  }}
                />
              </div>
              <p>
                {prepProgress.error
                  ? "下載失敗，請檢查網絡後再試。"
                  : `已下載 ${prepProgress.done} / ${prepProgress.total} 個檔案`}
              </p>
            </div>
          ) : null}
          {prepDone ? <p className="prep-success">這個計劃已準備好離線使用。</p> : null}
        </Modal>
      ) : null}
    </div>
  );
}
