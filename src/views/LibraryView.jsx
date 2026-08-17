import {
  Download,
  ExternalLink,
  FileUp,
  Library as LibraryIcon,
  Pencil,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button, IconButton } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { MediaThumb } from "../components/MediaThumb.jsx";
import { Modal } from "../components/Modal.jsx";
import {
  DECADES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  PLACES,
  THEMES
} from "../data/starter.js";
import { exportContentPack, importContentPack } from "../lib/packages.js";
import { useStore } from "../lib/store.jsx";

const FILE_ACCEPT = {
  song: "audio/*,.wav,.mp3,.m4a,.aac",
  video: "video/*,.mp4,.webm,.mov",
  photo: "image/*,.png,.jpg,.jpeg,.webp"
};

const blankDraft = () => ({
  id: `media-${Date.now()}`,
  type: "photo",
  title: "",
  year: "",
  decade: "",
  place: "其他",
  theme: THEMES[0],
  caption: "",
  notes: "",
  sourceCredit: "院舍自備",
  mediaUrl: "",
  coverUrl: "",
  posterUrl: "",
  duration: null,
  questions: { recall: [], discussion: [] }
});

const cloneDraft = (item) => ({
  ...JSON.parse(JSON.stringify(item)),
  questions: {
    recall: item.questions?.recall?.map((q) => ({ ...q, options: [...(q.options || [])] })) || [],
    discussion: [...(item.questions?.discussion || [])]
  }
});

function MediaEditor({ draft, setDraft, onClose, onSave, error }) {
  const update = (patch) => setDraft({ ...draft, ...patch });
  const updateQuestion = (index, patch) =>
    setDraft({
      ...draft,
      questions: {
        ...draft.questions,
        recall: draft.questions.recall.map((q, i) =>
          i === index ? { ...q, ...patch } : q
        )
      }
    });
  const updateDiscussion = (index, value) =>
    setDraft({
      ...draft,
      questions: {
        ...draft.questions,
        discussion: draft.questions.discussion.map((text, i) =>
          i === index ? value : text
        )
      }
    });

  const fileUrl = (field, file) => {
    if (!file) return;
    update({ [field]: URL.createObjectURL(file) });
  };

  const type = draft.type;

  return (
    <Modal
      title="編輯內容"
      subtitle="媒體資料與問題會保存在這部裝置上"
      onClose={onClose}
      width={880}
      footer={
        <div className="modal-footer-inner">
          {error ? <p className="form-error">{error}</p> : null}
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={onSave}>
            儲存
          </Button>
        </div>
      }
    >
      <div className="form-grid">
        <label className="form-field">
          <span className="field-label">標題</span>
          <input
            className="input"
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
          />
        </label>
        <label className="form-field">
          <span className="field-label">類型</span>
          <select
            className="select"
            value={type}
            onChange={(event) =>
              update({
                type: event.target.value,
                mediaUrl: event.target.value === "text" ? "" : draft.mediaUrl
              })
            }
          >
            {MEDIA_TYPES.map((mediaType) => (
              <option key={mediaType} value={mediaType}>
                {MEDIA_TYPE_LABELS[mediaType]}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="field-label">主題</span>
          <select
            className="select"
            value={draft.theme}
            onChange={(event) => update({ theme: event.target.value })}
          >
            {THEMES.map((theme) => (
              <option key={theme}>{theme}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="field-label">年代</span>
          <select
            className="select"
            value={draft.decade}
            onChange={(event) => update({ decade: event.target.value })}
          >
            <option value="">不指定</option>
            {DECADES.map((decade) => (
              <option key={decade}>{decade}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="field-label">地區</span>
          <select
            className="select"
            value={draft.place}
            onChange={(event) => update({ place: event.target.value })}
          >
            {PLACES.map((place) => (
              <option key={place}>{place}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="field-label">年份</span>
          <input
            className="input"
            value={draft.year}
            onChange={(event) => update({ year: event.target.value })}
            placeholder="例如 1960年代"
          />
        </label>
      </div>

      <div className="form-grid editor-file-grid">
        {type !== "text" ? (
          <label className="form-field">
            <span className="field-label">
              {type === "song"
                ? "歌曲檔案"
                : type === "video"
                  ? "影片檔案"
                  : "相片檔案"}
            </span>
            <input
              className="file-input"
              type="file"
              accept={FILE_ACCEPT[type]}
              onChange={(event) => fileUrl("mediaUrl", event.target.files?.[0])}
            />
            {draft.mediaUrl ? (
              <span className="file-name">已選擇檔案</span>
            ) : null}
          </label>
        ) : null}
        {type === "song" || type === "video" ? (
          <label className="form-field">
            <span className="field-label">封面圖片</span>
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={(event) =>
                fileUrl(type === "song" ? "coverUrl" : "posterUrl", event.target.files?.[0])
              }
            />
            {draft.coverUrl || draft.posterUrl ? (
              <span className="file-name">已選擇封面</span>
            ) : null}
          </label>
        ) : null}
      </div>

      <div className="form-grid">
        <label className="form-field field-full">
          <span className="field-label">說明</span>
          <textarea
            className="textarea"
            value={draft.caption}
            onChange={(event) => update({ caption: event.target.value })}
          />
        </label>
        <label className="form-field field-full">
          <span className="field-label">備註</span>
          <textarea
            className="textarea"
            value={draft.notes}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </label>
        <label className="form-field field-full">
          <span className="field-label">來源</span>
          <input
            className="input"
            value={draft.sourceCredit}
            onChange={(event) => update({ sourceCredit: event.target.value })}
          />
        </label>
      </div>

      <section className="editor-section">
        <div className="section-head">
          <h3>回憶問題</h3>
          <Button
            variant="quiet"
            size="sm"
            icon={Plus}
            onClick={() =>
              setDraft({
                ...draft,
                questions: {
                  ...draft.questions,
                  recall: [
                    ...draft.questions.recall,
                    { question: "", options: [], answer: "" }
                  ]
                }
              })
            }
          >
            新增
          </Button>
        </div>
        {draft.questions.recall.length ? (
          <div className="question-edit-list">
            {draft.questions.recall.map((question, index) => (
              <div className="question-edit-row" key={index}>
                <div className="question-edit-row-head">
                  <span>問題 {index + 1}</span>
                  <IconButton
                    icon={Trash2}
                    label="移除"
                    className="icon-btn-sm icon-btn-danger"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        questions: {
                          ...draft.questions,
                          recall: draft.questions.recall.filter(
                            (_, i) => i !== index
                          )
                        }
                      })
                    }
                  />
                </div>
                <input
                  className="input"
                  value={question.question}
                  onChange={(event) =>
                    updateQuestion(index, { question: event.target.value })
                  }
                  placeholder="問題"
                />
                <textarea
                  className="textarea textarea-sm"
                  value={(question.options || []).join("\n")}
                  onChange={(event) =>
                    updateQuestion(index, {
                      options: event.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                    })
                  }
                  placeholder={"選項（每行一個）"}
                />
                <input
                  className="input"
                  value={question.answer}
                  onChange={(event) =>
                    updateQuestion(index, { answer: event.target.value })
                  }
                  placeholder="正確答案"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">尚未加入回憶問題。</p>
        )}
      </section>

      <section className="editor-section">
        <div className="section-head">
          <h3>討論問題</h3>
          <Button
            variant="quiet"
            size="sm"
            icon={Plus}
            onClick={() =>
              setDraft({
                ...draft,
                questions: {
                  ...draft.questions,
                  discussion: [...draft.questions.discussion, ""]
                }
              })
            }
          >
            新增
          </Button>
        </div>
        {draft.questions.discussion.length ? (
          <div className="discussion-edit-list">
            {draft.questions.discussion.map((prompt, index) => (
              <div className="discussion-edit-row" key={index}>
                <input
                  className="input"
                  value={prompt}
                  onChange={(event) => updateDiscussion(index, event.target.value)}
                  placeholder="討論問題"
                />
                <IconButton
                  icon={Trash2}
                  label="移除"
                  className="icon-btn-sm icon-btn-danger"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      questions: {
                        ...draft.questions,
                        discussion: draft.questions.discussion.filter(
                          (_, i) => i !== index
                        )
                      }
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">尚未加入討論問題。</p>
        )}
      </section>
    </Modal>
  );
}

export function LibraryView({ navigate }) {
  const { library, plans, saveMedia, savePlan, deleteMedia } = useStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return library.filter((item) => {
      const typeMatch = filter === "all" || item.type === filter;
      const searchable = [
        item.title,
        item.caption,
        item.place,
        item.theme,
        item.year
      ]
        .join(" ")
        .toLowerCase();
      return typeMatch && (!text || searchable.includes(text));
    });
  }, [library, filter, query]);

  const openEditor = (item) => {
    setEditor(item || "new");
    setDraft(item ? cloneDraft(item) : blankDraft());
    setError("");
  };

  const save = () => {
    if (!draft.title.trim()) {
      setError("請填寫標題。");
      return;
    }
    if (draft.type !== "text" && !draft.mediaUrl) {
      setError("請選擇內容檔案。");
      return;
    }
    saveMedia(draft);
    setEditor(null);
    setDraft(null);
  };

  const removeItem = (id, title) => {
    if (window.confirm(`刪除「${title}」？`)) {
      deleteMedia(id);
    }
  };

  const importPack = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      const [packFile, ...extraFiles] = files;
      const result = await importContentPack(packFile, extraFiles);
      result.library.forEach((item) => saveMedia(item));
      result.plans.forEach((plan) => savePlan(plan));
      setNotice(`已匯入 ${result.library.length} 個內容項目和 ${result.plans.length} 個活動計劃。`);
    } catch (importError) {
      setNotice(`匯入失敗：${importError.message}`);
    }
    event.target.value = "";
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">內容資料庫</p>
          <h1 className="page-title">本地內容</h1>
          <p className="page-subtitle">
            {library.length} 個內容項目 · {plans.length} 個活動計劃
          </p>
        </div>
        <div className="page-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.rempack.json"
            multiple
            hidden
            onChange={importPack}
          />
          <Button
            variant="ghost"
            icon={FileUp}
            onClick={() => fileInputRef.current?.click()}
          >
            匯入內容包
          </Button>
          <Button
            variant="ghost"
            icon={Download}
            onClick={() => exportContentPack(library, plans)}
          >
            匯出內容包
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => openEditor(null)}>
            新增內容
          </Button>
        </div>
      </header>

      {notice ? <div className="notice">{notice}</div> : null}

      <div className="library-toolbar">
        <div className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋標題、地區或主題"
          />
        </div>
        <div className="type-tabs" role="tablist" aria-label="內容類型">
          {["all", ...MEDIA_TYPES].map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={filter === type}
              className={`chip ${filter === type ? "chip-active" : ""}`}
              onClick={() => setFilter(type)}
            >
              {type === "all" ? "全部" : MEDIA_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="library-list">
          {filtered.map((item) => (
            <article className="library-row" key={item.id}>
              <MediaThumb item={item} size="sm" />
              <div className="library-row-main">
                <div className="library-row-title">
                  <strong>{item.title}</strong>
                  <span className="tag">{MEDIA_TYPE_LABELS[item.type]}</span>
                  {item.decade ? <span className="tag tag-gold">{item.decade}</span> : null}
                  <span className="tag">{item.place}</span>
                </div>
                {item.caption ? (
                  <p className="muted small library-row-caption">{item.caption}</p>
                ) : null}
              </div>
              <div className="library-row-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Pencil}
                  onClick={() => openEditor(item)}
                >
                  編輯
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={ExternalLink}
                  onClick={() => navigate(`/media/${item.id}`)}
                >
                  開啟
                </Button>
                <IconButton
                  icon={Trash2}
                  label="刪除"
                  className="icon-btn-sm icon-btn-danger"
                  onClick={() => removeItem(item.id, item.title)}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={LibraryIcon}
          title="沒有符合的內容"
          description="調整篩選，或者加入新的內容項目。"
          action={
            <Button variant="primary" icon={Plus} onClick={() => openEditor(null)}>
              新增內容
            </Button>
          }
        />
      )}

      {editor ? (
        <MediaEditor
          draft={draft}
          setDraft={setDraft}
          error={error}
          onClose={() => {
            setEditor(null);
            setDraft(null);
          }}
          onSave={save}
        />
      ) : null}
    </div>
  );
}
