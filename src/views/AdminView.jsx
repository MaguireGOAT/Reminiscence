import { useCallback, useEffect, useState } from "react";
import {
  commitBinary,
  commitFile,
  clearAuth,
  fetchOEmbed,
  getRepoInfo,
  getToken,
  isAuthenticated,
  readJson,
  setRepoInfo,
  setToken
} from "../lib/github.js";
import { MEDIA_TYPE_LABELS, PHASES, THEMES } from "../data/starter.js";
import { MediaThumb } from "../components/MediaThumb.jsx";

const pad3 = (v) => String(v).padStart(3, "0");
const MANIFEST = "public/content/manifest.json";
const MEDIA_DIR = "public/content/media";
const SIZE_WARN = { photo: 10, song: 25, video: 50 };

function nextId(items, prefix) {
  const max = items.reduce((m, it) => {
    const n = parseInt(it.id?.split("-")[1], 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${pad3(max + 1)}`;
}

export function AdminView() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("media");

  // Auth form state
  const [tokenInput, setTokenInput] = useState(getToken());
  const [usernameInput, setUsernameInput] = useState(getRepoInfo().owner);

  const loadManifest = useCallback(async () => {
    if (!isAuthenticated()) return;
    setLoading(true);
    setError("");
    try {
      const data = await readJson(MANIFEST);
      setManifest(data);
    } catch (e) {
      // File may not exist yet
      setManifest({ version: 1, media: [], plans: [], textCards: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadManifest();
  }, [authed, loadManifest]);

  const handleLogin = (e) => {
    e.preventDefault();
    const existing = getRepoInfo();
    setToken(tokenInput.trim());
    setRepoInfo(usernameInput.trim(), existing.repo || "Reminiscence", existing.branch || "main");
    setAuthed(true);
  };

  const handleLogout = () => {
    clearAuth();
    setAuthed(false);
    setManifest(null);
  };

  if (!authed) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1 className="login-title">登入</h1>
          <label className="login-field">
            <span>使用者名稱</span>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="login-field">
            <span>密碼</span>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary btn-lg login-submit">登入</button>
        </form>
      </div>
    );
  }

  const media = manifest?.media || [];
  const plans = manifest?.plans || [];
  const textCards = manifest?.textCards || [];

  return (
    <div className="page admin-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">內容管理</h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setEditing({ type: "new" })}>新增內容</button>
          <button className="btn btn-quiet" onClick={handleLogout}>登出</button>
        </div>
      </header>

      {error && <div className="notice" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>{error}</div>}

      <div className="admin-tabs">
        {["media", "text", "plans"].map((t) => (
          <button key={t} className={`question-tab ${tab === t ? "question-tab-active" : ""}`} onClick={() => setTab(t)}>
            {t === "media" ? `媒體 (${media.length})` : t === "text" ? `文字卡 (${textCards.length})` : `計劃 (${plans.length})`}
          </button>
        ))}
      </div>

      {loading && <p>載入中...</p>}

      {tab === "media" && (
        <div className="admin-list">
          {media.length === 0 && <p className="admin-empty">尚未上傳任何媒體內容</p>}
          {media.map((item) => (
            <MediaRow key={item.id} item={item} onEdit={() => setEditing({ type: "edit", item })} manifest={manifest} setManifest={setManifest} setError={setError} />
          ))}
        </div>
      )}

      {tab === "text" && (
        <div className="admin-list">
          {textCards.length === 0 && <p className="admin-empty">尚未新增文字卡</p>}
          {textCards.map((item) => (
            <MediaRow key={item.id} item={item} onEdit={() => setEditing({ type: "edit", item })} manifest={manifest} setManifest={setManifest} setError={setError} />
          ))}
        </div>
      )}

      {tab === "plans" && <PlanList plans={plans} manifest={manifest} setManifest={setManifest} setError={setError} />}

      {editing && (
        <UploadModal
          editing={editing}
          manifest={manifest}
          setManifest={setManifest}
          onClose={() => setEditing(null)}
          setError={setError}
        />
      )}
    </div>
  );
}

function MediaRow({ item, onEdit, manifest, setManifest, setError }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`確定刪除「${item.title}」？`)) return;
    setDeleting(true);
    try {
      const newManifest = { ...manifest };
      const listKey = item.type === "text" ? "textCards" : "media";
      newManifest[listKey] = newManifest[listKey].filter((m) => m.id !== item.id);
      await commitFile(MANIFEST, JSON.stringify(newManifest, null, 2), `刪除 ${item.title}`);
      setManifest(newManifest);
    } catch (e) {
      setError(`刪除失敗: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-row">
      <MediaThumb item={item} size="sm" />
      <div className="admin-row-info">
        <strong>{item.title}</strong>
        <span className="admin-row-meta">
          {MEDIA_TYPE_LABELS[item.type] || item.type} · {item.theme} · {item.year || ""}
        </span>
      </div>
      <div className="admin-row-actions">
        <button className="btn btn-quiet" onClick={onEdit}>編輯</button>
        <button className="btn btn-quiet" onClick={handleDelete} disabled={deleting}>刪除</button>
      </div>
    </div>
  );
}

function PlanList({ plans, manifest, setManifest, setError }) {
  const handleAdd = async () => {
    const id = `plan-${pad3(plans.length + 1)}`;
    const newPlan = {
      id,
      title: "新計劃",
      theme: THEMES[0],
      minutes: 30,
      updatedAt: new Date().toISOString().slice(0, 10),
      phases: PHASES.map((p) => ({ phaseId: p.id, label: p.label, mediaIds: [] }))
    };
    const newManifest = { ...manifest, plans: [...plans, newPlan] };
    try {
      await commitFile(MANIFEST, JSON.stringify(newManifest, null, 2), `新增計劃 ${newPlan.title}`);
      setManifest(newManifest);
    } catch (e) {
      setError(`新增失敗: ${e.message}`);
    }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`確定刪除計劃「${plan.title}」？`)) return;
    const newManifest = { ...manifest, plans: plans.filter((p) => p.id !== plan.id) };
    try {
      await commitFile(MANIFEST, JSON.stringify(newManifest, null, 2), `刪除計劃 ${plan.title}`);
      setManifest(newManifest);
    } catch (e) {
      setError(`刪除失敗: ${e.message}`);
    }
  };

  return (
    <div className="admin-list">
      {plans.length === 0 && <p className="admin-empty">尚未建立任何計劃</p>}
      {plans.map((plan) => (
        <div key={plan.id} className="admin-row">
          <div className="admin-row-info">
            <strong>{plan.title}</strong>
            <span className="admin-row-meta">{plan.theme} · {plan.minutes} 分鐘</span>
          </div>
          <div className="admin-row-actions">
            <button className="btn btn-quiet" onClick={() => handleDelete(plan)}>刪除</button>
          </div>
        </div>
      ))}
      <button className="btn btn-primary" onClick={handleAdd}>新增計劃</button>
    </div>
  );
}

function UploadModal({ editing, manifest, setManifest, onClose, setError }) {
  const isNew = editing.type === "new";
  const existing = isNew ? null : editing.item;

  const [uploadMode, setUploadMode] = useState("file"); // "file" | "url"
  const [mediaType, setMediaType] = useState(existing?.type || "photo");
  const [title, setTitle] = useState(existing?.title || "");
  const [year, setYear] = useState(existing?.year || "");
  const [theme, setTheme] = useState(
    existing && !THEMES.includes(existing.theme) ? "__custom__" : (existing?.theme || THEMES[0])
  );
  const [customTheme, setCustomTheme] = useState(
    existing && !THEMES.includes(existing.theme) ? existing.theme : ""
  );
  const [caption, setCaption] = useState(existing?.caption || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [place, setPlace] = useState(existing?.place || "");
  const [sourceCredit, setSourceCredit] = useState(existing?.sourceCredit || "");
  const [mediaUrl, setMediaUrl] = useState(existing?.mediaUrl || "");
  const [posterUrl, setPosterUrl] = useState(existing?.posterUrl || "");
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [customQuestions, setCustomQuestions] = useState(() => {
    const list = [];
    for (const q of existing?.questions?.recall || []) {
      list.push({
        id: `q-${list.length + 1}`,
        type: "factual",
        question: q.question || "",
        options: [...(q.options || [])],
        answerIndex: Math.max(0, (q.options || []).indexOf(q.answer))
      });
    }
    for (const d of existing?.questions?.discussion || []) {
      list.push({ id: `q-${list.length + 1}`, type: "discussion", question: d });
    }
    return list;
  });
  const [questionDraftType, setQuestionDraftType] = useState("discussion");
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftOptions, setDraftOptions] = useState(["", "", "", ""]);
  const [draftAnswer, setDraftAnswer] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sizeWarn, setSizeWarn] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const mb = f.size / (1024 * 1024);
    const limit = SIZE_WARN[mediaType] || 50;
    if (mb > limit) setSizeWarn(`檔案大小 ${mb.toFixed(1)} MB，建議低於 ${limit} MB`);
    else setSizeWarn("");
    if (previewSrc?.startsWith("blob:")) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(f ? URL.createObjectURL(f) : "");
    setFile(f);
    setUrlInput("");
  };

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return;
    setSaving(true);
    try {
      // Check if YouTube
      if (/youtube\.com|youtu\.be/.test(urlInput)) {
        const oembed = await fetchOEmbed(urlInput.trim());
        setTitle((prev) => prev || oembed.title || "");
        setMediaType("video");
        setFile(null);
        setPreviewSrc("");
        setMediaUrl(urlInput.trim());
      } else {
        // Fetch the file
        const resp = await fetch(urlInput.trim());
        if (!resp.ok) throw new Error(`下載失敗: ${resp.status}`);
        const blob = await resp.blob();
        const name = urlInput.split("/").pop().split("?")[0] || "downloaded-file";
        const f = new File([blob], name, { type: blob.type });
        const mb = f.size / (1024 * 1024);
        const limit = SIZE_WARN[mediaType] || 50;
        if (mb > limit) setSizeWarn(`檔案大小 ${mb.toFixed(1)} MB，建議低於 ${limit} MB`);
        else setSizeWarn("");
        if (previewSrc?.startsWith("blob:")) URL.revokeObjectURL(previewSrc);
        setPreviewSrc(URL.createObjectURL(f));
        setFile(f);
      }
    } catch (e) {
      setError(`下載失敗: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const setDraftOption = (index, value) => {
    setDraftOptions((opts) => opts.map((o, i) => (i === index ? value : o)));
  };

  const addQuestion = () => {
    const question = draftQuestion.trim();
    if (!question) return;
    if (questionDraftType === "factual") {
      const filled = draftOptions.map((o) => o.trim());
      const filledIndices = filled.map((o, i) => (o ? i : -1)).filter((i) => i >= 0);
      if (filledIndices.length < 2) {
        setError("事實題需要至少兩個選項");
        return;
      }
      const answerPosition = filledIndices.indexOf(draftAnswer);
      if (answerPosition < 0) {
        setError("請選擇正確答案所在的選項");
        return;
      }
      setCustomQuestions((list) => [
        ...list,
        {
          id: `q-${Date.now()}`,
          type: "factual",
          question,
          options: filled.filter(Boolean),
          answerIndex: answerPosition
        }
      ]);
    } else {
      setCustomQuestions((list) => [
        ...list,
        { id: `q-${Date.now()}`, type: "discussion", question }
      ]);
    }
    setDraftQuestion("");
    setDraftOptions(["", "", "", ""]);
    setDraftAnswer(0);
  };

  const removeQuestion = (id) => {
    setCustomQuestions((list) => list.filter((q) => q.id !== id));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let finalMediaUrl = mediaUrl;
      let finalPosterUrl = posterUrl;

      // Upload file if we have one
      if (file) {
        const ext = file.name.split(".").pop();
        const listKey = mediaType === "text" ? "textCards" : "media";
        const items = manifest[listKey] || [];
        const id = existing?.id || nextId(items, mediaType === "text" ? "text" : mediaType === "song" ? "song" : mediaType === "video" ? "video" : "photo");
        const path = `${MEDIA_DIR}/${id}.${ext}`;
        await commitBinary(path, file, `上傳 ${title}`);
        finalMediaUrl = `${import.meta.env.BASE_URL}content/media/${id}.${ext}`;
      }

      // Build the item
      const listKey = mediaType === "text" ? "textCards" : "media";
      const items = manifest[listKey] || [];
      const id = existing?.id || nextId(items, mediaType === "text" ? "text" : mediaType);

      const item = {
        id,
        type: mediaType,
        title,
        year,
        place,
        theme: theme === "__custom__" ? customTheme.trim() || "自訂" : theme,
        caption,
        notes,
        mediaUrl: finalMediaUrl,
        sourceCredit,
        questions: {
          recall: customQuestions.filter((q) => q.type === "factual").map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.options[q.answerIndex]
          })),
          discussion: customQuestions.filter((q) => q.type === "discussion").map((q) => q.question)
        }
      };
      if (mediaType === "video" && finalPosterUrl) item.posterUrl = finalPosterUrl;

      // Update manifest
      const newManifest = { ...manifest };
      if (existing) {
        newManifest[listKey] = newManifest[listKey].map((m) => (m.id === id ? item : m));
      } else {
        newManifest[listKey] = [...newManifest[listKey], item];
      }

      await commitFile(MANIFEST, JSON.stringify(newManifest, null, 2), `${existing ? "更新" : "新增"} ${title}`);
      setManifest(newManifest);
      onClose();
    } catch (e) {
      setError(`儲存失敗: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestClose = () => {
    if (window.confirm("確定要關閉嗎？未儲存嘅更改會遺失。")) onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title">{existing ? "編輯內容" : "新增內容"}</h2>
          <button className="btn btn-quiet" onClick={handleRequestClose}>關閉</button>
        </div>
        <form className="modal-body admin-form" onSubmit={handleSave}>
          {isNew && (
            <div className="admin-form-row">
              <label>類型</label>
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                <option value="photo">相片</option>
                <option value="song">歌曲</option>
                <option value="video">影片</option>
                <option value="text">文字卡</option>
              </select>
            </div>
          )}

          {mediaType !== "text" && (
            <>
              <div className="admin-form-row">
                <label>上傳方式</label>
                <div className="admin-toggle">
                  <button type="button" className={`btn ${uploadMode === "file" ? "btn-primary" : "btn-quiet"}`} onClick={() => setUploadMode("file")}>從裝置上傳</button>
                  <button type="button" className={`btn ${uploadMode === "url" ? "btn-primary" : "btn-quiet"}`} onClick={() => setUploadMode("url")}>貼上網址</button>
                </div>
              </div>

              {uploadMode === "file" ? (
                <div className="admin-form-row">
                  <label>選擇檔案</label>
                  <input type="file" accept={mediaType === "photo" ? "image/*" : mediaType === "song" ? "audio/*" : "video/*"} onChange={handleFileChange} />
                </div>
              ) : (
                <div className="admin-form-row">
                  <label>網址</label>
                  <div className="admin-url-row">
                    <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." />
                    <button type="button" className="btn btn-quiet" onClick={handleUrlFetch} disabled={saving}>下載</button>
                  </div>
                </div>
              )}

              {sizeWarn && <div className="notice">{sizeWarn}</div>}
              {file && <p className="admin-file-name">已選擇: {file.name}</p>}
              {!file && mediaUrl && <p className="admin-file-name">目前: {mediaUrl}</p>}
              {(file || mediaUrl) ? (
                <div className="admin-preview">
                  {mediaType === "photo" ? (
                    <img src={file ? previewSrc : mediaUrl} alt="預覽" />
                  ) : null}
                  {mediaType === "song" ? (
                    <audio src={file ? previewSrc : mediaUrl} controls />
                  ) : null}
                  {mediaType === "video" ? (
                    /youtube\.com|youtu\.be/.test(mediaUrl) && !file ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${mediaUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]}`}
                        title="影片預覽"
                        allowFullScreen
                      />
                    ) : (
                      <video src={file ? previewSrc : mediaUrl} controls />
                    )
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          <div className="admin-form-row">
            <label>標題</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="admin-form-row">
            <label>主題</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
              <option value="__custom__">自訂</option>
            </select>
          </div>

          {theme === "__custom__" && (
            <div className="admin-form-row">
              <label>自訂主題</label>
              <input value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} placeholder="例如：食物" required />
            </div>
          )}

          <div className="admin-form-row">
            <label>年份</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="1960年代" />
          </div>

          <div className="admin-form-row">
            <label>描述</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} />
          </div>

          <div className="admin-form-row">
            <label>地點</label>
            <input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>

          <div className="admin-form-row">
            <label>來源</label>
            <input value={sourceCredit} onChange={(e) => setSourceCredit(e.target.value)} />
          </div>

          <div className="admin-form-row">
            <label>備註</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="admin-form-row">
            <label>問題類型</label>
            <select value={questionDraftType} onChange={(e) => setQuestionDraftType(e.target.value)}>
              <option value="discussion">討論題</option>
              <option value="factual">事實題</option>
            </select>
          </div>

          {questionDraftType === "discussion" ? (
            <div className="admin-form-row">
              <label>討論問題</label>
              <input value={draftQuestion} onChange={(e) => setDraftQuestion(e.target.value)} placeholder="例如：這張相片令你想起甚麼？" />
            </div>
          ) : (
            <>
              <div className="admin-form-row">
                <label>問題</label>
                <input value={draftQuestion} onChange={(e) => setDraftQuestion(e.target.value)} placeholder="例如：這張相片拍攝於哪一年？" />
              </div>
              <div className="admin-form-row">
                <label>選項（選擇正確答案）</label>
                <div className="admin-option-grid">
                  {draftOptions.map((option, index) => (
                    <div className="admin-option-row" key={index}>
                      <span className="admin-option-letter">{String.fromCharCode(65 + index)}</span>
                      <input value={option} onChange={(e) => setDraftOption(index, e.target.value)} placeholder={`選項 ${String.fromCharCode(65 + index)}`} />
                      <label className="admin-option-answer">
                        <input type="radio" name="draft-answer" checked={draftAnswer === index} onChange={() => setDraftAnswer(index)} />
                        正確
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="admin-question-actions">
            <button type="button" className="btn btn-quiet" onClick={addQuestion}>加入問題</button>
          </div>

          {customQuestions.length > 0 && (
            <div className="admin-questions-list">
              {customQuestions.map((q) => (
                <div className="admin-question-row" key={q.id}>
                  <span className="tag">{q.type === "factual" ? "事實題" : "討論題"}</span>
                  <span className="admin-question-text">{q.question}</span>
                  <button type="button" className="btn btn-quiet" onClick={() => removeQuestion(q.id)}>刪除</button>
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-quiet" onClick={handleRequestClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "儲存中..." : "儲存並發佈"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
