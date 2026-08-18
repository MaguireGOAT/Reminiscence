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
  const [ownerInput, setOwnerInput] = useState(getRepoInfo().owner);
  const [repoInput, setRepoInput] = useState(getRepoInfo().repo);
  const [branchInput, setBranchInput] = useState(getRepoInfo().branch || "main");

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
    setToken(tokenInput.trim());
    setRepoInfo(ownerInput.trim(), repoInput.trim(), branchInput.trim());
    setAuthed(true);
  };

  const handleLogout = () => {
    clearAuth();
    setAuthed(false);
    setManifest(null);
  };

  if (!authed) {
    return (
      <div className="page admin-page">
        <h1 className="page-title">管理員登入</h1>
        <p className="page-subtitle">輸入 GitHub 個人存取令牌和倉庫資訊</p>
        <form className="admin-login-form" onSubmit={handleLogin}>
          <label>
            <span>GitHub Token</span>
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="ghp_..." required />
          </label>
          <label>
            <span>倉庫擁有者</span>
            <input value={ownerInput} onChange={(e) => setOwnerInput(e.target.value)} placeholder="username" required />
          </label>
          <label>
            <span>倉庫名稱</span>
            <input value={repoInput} onChange={(e) => setRepoInput(e.target.value)} placeholder="reminiscence-pwa" required />
          </label>
          <label>
            <span>分支</span>
            <input value={branchInput} onChange={(e) => setBranchInput(e.target.value)} placeholder="main" />
          </label>
          <button type="submit" className="btn btn-primary">登入</button>
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
          <p className="page-subtitle">{getRepoInfo().owner}/{getRepoInfo().repo}</p>
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
  const [theme, setTheme] = useState(existing?.theme || THEMES[0]);
  const [caption, setCaption] = useState(existing?.caption || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [place, setPlace] = useState(existing?.place || "");
  const [sourceCredit, setSourceCredit] = useState(existing?.sourceCredit || "");
  const [mediaUrl, setMediaUrl] = useState(existing?.mediaUrl || "");
  const [posterUrl, setPosterUrl] = useState(existing?.posterUrl || "");
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [customQuestions, setCustomQuestions] = useState(
    existing?.questions?.discussion?.length
      ? existing.questions.discussion.join("\n")
      : ""
  );
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
        theme,
        caption,
        notes,
        mediaUrl: finalMediaUrl,
        sourceCredit,
        questions: {
          recall: [],
          discussion: customQuestions.split("\n").map((q) => q.trim()).filter(Boolean)
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

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title">{existing ? "編輯內容" : "新增內容"}</h2>
          <button className="btn btn-quiet" onClick={onClose}>關閉</button>
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
            <label>主題（可自訂）</label>
            <input value={theme} onChange={(e) => setTheme(e.target.value)} list="theme-options" placeholder="例如：食物" required />
            <datalist id="theme-options">
              {THEMES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>

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
            <label>自訂問題（每行一個）</label>
            <textarea value={customQuestions} onChange={(e) => setCustomQuestions(e.target.value)} rows={4} placeholder={"這張相片令你想起甚麼？\n你以前去過這個地方嗎？"} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-quiet" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "儲存中..." : "儲存並發佈"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
