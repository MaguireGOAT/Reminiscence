import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function UpdateBanner() {
  const [waiting, setWaiting] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // After first load, subsequent detections show the choice banner
    const timer = setTimeout(() => setIsFirstLoad(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onWaiting = (reg) => {
      if (reg.waiting) {
        setWaiting(reg.waiting);
      }
    };

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

    // Also listen for controllerchange (new SW activated)
    const onControllerChange = () => {
      if (!isFirstLoad) {
        // Only reload if not the initial page load
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [isFirstLoad]);

  if (!waiting) return null;

  const handleNow = () => {
    waiting.postMessage({ type: "SKIP_WAITING" });
    waiting.addEventListener("statechange", (e) => {
      if (e.target.state === "activated") {
        window.location.reload();
      }
    });
  };

  const handleLater = () => {
    setWaiting(null);
  };

  // If user just opened the app, force update immediately
  if (isFirstLoad) {
    handleNow();
    return (
      <div className="update-banner">
        <RefreshCw size={18} aria-hidden="true" />
        正在載入新版本...
      </div>
    );
  }

  return (
    <div className="update-banner">
      <RefreshCw size={18} aria-hidden="true" />
      有新版本可用
      <button type="button" className="btn" onClick={handleNow}>立即更新</button>
      <button type="button" className="btn" onClick={handleLater}>稍後再說</button>
    </div>
  );
}
