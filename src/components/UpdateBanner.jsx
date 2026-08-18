import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const UPDATE_TIMEOUT_MS = 10000;

export function UpdateBanner() {
  const [waiting, setWaiting] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [phase, setPhase] = useState("idle"); // "idle" | "updating" | "failed"
  const timerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsFirstLoad(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) setWaiting(reg.waiting);
      reg?.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (sw) {
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(reg.waiting || sw);
            }
          });
        }
      });
    });
  }, []);

  const startUpdate = () => {
    if (!waiting || phase !== "idle") return;
    setPhase("updating");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPhase("failed"), UPDATE_TIMEOUT_MS);
    try {
      waiting.postMessage({ type: "SKIP_WAITING" });
    } catch {
      setPhase("failed");
      return;
    }
    const onState = (event) => {
      if (event.target.state === "activated") {
        window.location.reload();
      }
    };
    waiting.addEventListener("statechange", onState);
  };

  useEffect(() => {
    if (waiting && isFirstLoad && phase === "idle") {
      startUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, isFirstLoad, phase]);

  const handleLater = () => {
    setWaiting(null);
  };

  const retryReload = () => {
    window.location.reload();
  };

  if (phase === "updating" || phase === "failed") {
    return (
      <div className="update-overlay" role="alertdialog" aria-modal="true">
        <div className="update-overlay-card">
          <span className="brand-mark">憶</span>
          {phase === "updating" ? (
            <>
              <p className="update-overlay-title">正在更新版本...</p>
              <div className="update-progress" aria-hidden="true">
                <span />
              </div>
            </>
          ) : (
            <>
              <p className="update-overlay-title">更新失敗，請重新整理</p>
              <button type="button" className="btn btn-primary" onClick={retryReload}>
                重新整理
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!waiting) return null;

  return (
    <div className="update-banner">
      <RefreshCw size={18} aria-hidden="true" />
      有新版本可用
      <button type="button" className="btn" onClick={startUpdate}>立即更新</button>
      <button type="button" className="btn" onClick={handleLater}>稍後再說</button>
    </div>
  );
}
