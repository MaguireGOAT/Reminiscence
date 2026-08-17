import { CalendarDays, Download, Plus, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Modal } from "../components/Modal.jsx";
import { THEMES } from "../data/starter.js";
import { exportLogsCsv } from "../lib/csv.js";
import { useStore } from "../lib/store.jsx";

const ENGAGEMENT = ["高", "中", "低"];

const today = () => new Date().toISOString().slice(0, 10);

const blankLog = (plans) => ({
  id: `log-${Date.now()}`,
  date: today(),
  planTitle: plans[0]?.title || "",
  theme: plans[0]?.theme || THEMES[0],
  attendance: 8,
  engagement: "中",
  notes: "",
  memories: ""
});

export function SessionLogView() {
  const { logs, plans, addLog, deleteLog } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  const openForm = () => {
    setDraft(blankLog(plans));
    setError("");
    setFormOpen(true);
  };

  const save = () => {
    if (!draft.date) {
      setError("請選擇日期。");
      return;
    }
    if (!draft.attendance || draft.attendance < 0) {
      setError("請輸入出席人數。");
      return;
    }
    addLog(draft);
    setFormOpen(false);
    setDraft(null);
  };

  const removeLog = (id) => {
    if (window.confirm("刪除這筆小組紀錄？")) {
      deleteLog(id);
    }
  };

  const exportPdf = () => window.print();

  return (
    <div className="page logs-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">小組紀錄</p>
          <h1 className="page-title">活動記錄</h1>
          <p className="page-subtitle">
            {logs.length} 筆紀錄，只保存在這部裝置。
          </p>
        </div>
        <div className="page-actions">
          <Button
            variant="ghost"
            icon={Printer}
            onClick={exportPdf}
            disabled={!logs.length}
          >
            匯出 PDF
          </Button>
          <Button
            variant="ghost"
            icon={Download}
            onClick={() => exportLogsCsv(logs)}
            disabled={!logs.length}
          >
            匯出 CSV
          </Button>
          <Button variant="primary" icon={Plus} onClick={openForm}>
            新增紀錄
          </Button>
        </div>
      </header>

      {logs.length ? (
        <div className="log-list">
          {logs.map((log) => (
            <article className="log-card" key={log.id}>
              <div className="log-card-head">
                <div>
                  <h2>{log.planTitle || log.theme}</h2>
                  <div className="log-meta">
                    <span className="tag">
                      <CalendarDays size={13} aria-hidden="true" />
                      {log.date}
                    </span>
                    <span className="tag tag-gold">{log.theme}</span>
                    <span className="tag">出席 {log.attendance} 人</span>
                    <span
                      className={`tag ${
                        log.engagement === "高"
                          ? "tag-jade"
                          : log.engagement === "低"
                            ? "tag-accent"
                            : ""
                      }`}
                    >
                      投入程度 {log.engagement}
                    </span>
                  </div>
                </div>
                <IconButton
                  icon={Trash2}
                  label="刪除"
                  className="icon-btn-danger"
                  onClick={() => removeLog(log.id)}
                />
              </div>
              {log.notes ? (
                <div className="log-note">
                  <span className="log-note-label">備註</span>
                  <p>{log.notes}</p>
                </div>
              ) : null}
              {log.memories ? (
                <div className="log-note">
                  <span className="log-note-label log-note-memory">難忘片段</span>
                  <p>{log.memories}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="尚未記錄小組活動"
          description="小組結束後，在這裡記下日期、人數和難忘片段。"
          action={
            <Button variant="primary" icon={Plus} onClick={openForm}>
              新增紀錄
            </Button>
          }
        />
      )}

      {formOpen && draft ? (
        <Modal
          title="新增小組紀錄"
          subtitle="資料只會保存在這部裝置"
          onClose={() => setFormOpen(false)}
          width={720}
          footer={
            <div className="modal-footer-inner">
              {error ? <p className="form-error">{error}</p> : null}
              <Button variant="ghost" onClick={() => setFormOpen(false)}>
                取消
              </Button>
              <Button variant="primary" onClick={save}>
                儲存紀錄
              </Button>
            </div>
          }
        >
          <div className="form-grid">
            <label className="form-field">
              <span className="field-label">日期</span>
              <input
                className="input"
                type="date"
                value={draft.date}
                onChange={(event) =>
                  setDraft({ ...draft, date: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span className="field-label">活動計劃</span>
              <select
                className="select"
                value={draft.planTitle}
                onChange={(event) =>
                  setDraft({ ...draft, planTitle: event.target.value })
                }
              >
                {plans.map((plan) => (
                  <option key={plan.id}>{plan.title}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="field-label">主題</span>
              <select
                className="select"
                value={draft.theme}
                onChange={(event) =>
                  setDraft({ ...draft, theme: event.target.value })
                }
              >
                {THEMES.map((theme) => (
                  <option key={theme}>{theme}</option>
                ))}
              </select>
            </label>
            <div className="form-grid form-grid-nested">
              <label className="form-field">
                <span className="field-label">出席人數</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="30"
                  value={draft.attendance}
                  onChange={(event) =>
                    setDraft({ ...draft, attendance: Number(event.target.value) })
                  }
                />
              </label>
              <label className="form-field">
                <span className="field-label">投入程度</span>
                <select
                  className="select"
                  value={draft.engagement}
                  onChange={(event) =>
                    setDraft({ ...draft, engagement: event.target.value })
                  }
                >
                  {ENGAGEMENT.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="form-field field-full">
              <span className="field-label">備註</span>
              <textarea
                className="textarea"
                value={draft.notes}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
              />
            </label>
            <label className="form-field field-full">
              <span className="field-label">難忘片段</span>
              <textarea
                className="textarea"
                value={draft.memories}
                onChange={(event) =>
                  setDraft({ ...draft, memories: event.target.value })
                }
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {logs.length ? (
        <div className="print-sheet" aria-hidden="true">
          <header className="print-sheet-header">
            <div>
              <p className="print-brand">憶當年</p>
              <h1>小組活動記錄</h1>
            </div>
            <p>匯出日期：{new Date().toLocaleDateString("zh-HK")}</p>
          </header>
          <table className="print-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>活動計劃 / 主題</th>
                <th>出席人數</th>
                <th>投入程度</th>
                <th>備註</th>
                <th>難忘片段</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>
                    <strong>{log.planTitle || log.theme}</strong>
                    {log.planTitle && log.theme ? (
                      <span className="print-sub">{log.theme}</span>
                    ) : null}
                  </td>
                  <td>{log.attendance}</td>
                  <td>{log.engagement}</td>
                  <td>{log.notes || "—"}</td>
                  <td>{log.memories || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
