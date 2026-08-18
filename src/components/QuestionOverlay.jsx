import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, MessageCircle, HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, IconButton } from "./Button.jsx";

export function QuestionOverlay({ item, onClose, initialTab = "recall", initialReveal = false }) {
  const [tab, setTab] = useState(() => {
    if (initialTab === "recall") {
      const recall = item.questions?.recall || [];
      const discussion = item.questions?.discussion || [];
      if (!recall.length && discussion.length) return "discussion";
    }
    return initialTab;
  });
  const [revealed, setRevealed] = useState(initialReveal);
  const [selected, setSelected] = useState(null);
  const [recallIndex, setRecallIndex] = useState(0);

  const questions = item.questions || { recall: [], discussion: [] };
  const recall = useMemo(
    () => (Array.isArray(questions.recall) ? questions.recall : []),
    [questions]
  );
  const discussion = useMemo(
    () => (Array.isArray(questions.discussion) ? questions.discussion : []),
    [questions]
  );

  const hasRecall = recall.length > 0;
  const currentRecall = recall[recall.length ? recallIndex % recall.length : 0];

  const changeRecall = (nextIndex) => {
    const count = recall.length || 1;
    setRecallIndex(((nextIndex % count) + count) % count);
    setRevealed(false);
    setSelected(null);
  };

  const choose = (index) => {
    if (revealed) return;
    setSelected(index);
  };

  return (
    <div className="question-overlay" role="dialog" aria-modal="true" aria-label="問題">
      <header className="question-overlay-head">
        <div>
          <h2>問題</h2>
          <p>{item.title}</p>
        </div>
        <IconButton icon={Check} label="完成" onClick={onClose} />
      </header>

      <div className="question-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "recall"}
          className={`question-tab ${tab === "recall" ? "question-tab-active" : ""}`}
          onClick={() => {
            setTab("recall");
            setRevealed(false);
            setSelected(null);
            setRecallIndex(0);
          }}
        >
          <HelpCircle size={16} aria-hidden="true" />
          回憶問題
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "discussion"}
          className={`question-tab ${tab === "discussion" ? "question-tab-active" : ""}`}
          onClick={() => {
            setTab("discussion");
            setRevealed(false);
            setSelected(null);
            setRecallIndex(0);
          }}
        >
          <MessageCircle size={16} aria-hidden="true" />
          討論
        </button>
      </div>

      <div className="question-overlay-body">
        {tab === "recall" ? (
          hasRecall ? (
            <div className="recall-block">
              {recall.length > 1 ? (
                <div className="recall-pager">
                  <button
                    type="button"
                    className="recall-pager-btn"
                    onClick={() => changeRecall(recallIndex - 1)}
                    aria-label="上一個問題"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <span className="recall-pager-count">
                    問題 {recallIndex + 1} / {recall.length}
                  </span>
                  <button
                    type="button"
                    className="recall-pager-btn"
                    onClick={() => changeRecall(recallIndex + 1)}
                    aria-label="下一個問題"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
              <p className="recall-question">{currentRecall.question}</p>
              <div className="recall-options">
                {(currentRecall.options || []).map((option, index) => {
                  const isCorrect = revealed && option === currentRecall.answer;
                  const isWrong =
                    revealed && selected === index && option !== currentRecall.answer;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`recall-option ${isCorrect ? "recall-option-correct" : ""} ${
                        isWrong ? "recall-option-wrong" : ""
                      } ${selected === index && !revealed ? "recall-option-selected" : ""}`}
                      onClick={() => choose(index)}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      {option}
                      {isCorrect ? <Check size={18} aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
              <Button
                variant={revealed ? "quiet" : "jade"}
                icon={revealed ? EyeOff : Eye}
                onClick={() => setRevealed((value) => !value)}
              >
                {revealed ? "隱藏答案" : "顯示答案"}
              </Button>
            </div>
          ) : (
            <p className="question-empty">這張卡沒有回憶問題。</p>
          )
        ) : discussion.length ? (
          <div className="discussion-list">
            {discussion.map((prompt, index) => (
              <div className="discussion-prompt" key={`${prompt}-${index}`}>
                <span>{index + 1}</span>
                <p>{prompt}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="question-empty">這張卡沒有討論問題。</p>
        )}
      </div>
    </div>
  );
}
