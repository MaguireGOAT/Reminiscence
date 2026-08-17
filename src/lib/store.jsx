import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { idbDelete, idbGetAll, idbPut } from "./idb.js";
import {
  deleteMediaBlobs,
  hydrateMediaUrls,
  persistMediaBlobs
} from "./media-storage.js";
import { loadContentFromManifest } from "./content.js";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [library, setLibrary] = useState([]);
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [prepared, setPrepared] = useState([]);
  const skipPersist = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { media, plans: manifestPlans, textCards } =
          await loadContentFromManifest();
        const storedLogs = await idbGetAll("logs");
        const storedPrepared = await idbGetAll("meta");
        if (!cancelled) {
          setLibrary([...media, ...textCards]);
          setPlans(manifestPlans);
          setLogs(storedLogs);
          setPrepared(
            storedPrepared.map((m) => m.id.replace("prepared:", ""))
          );
          setReady(true);
          setTimeout(() => { skipPersist.current = false; }, 0);
        }
      } catch (error) {
        console.error("Failed to load content:", error);
        if (!cancelled) {
          setReady(true);
          setTimeout(() => { skipPersist.current = false; }, 0);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || skipPersist.current) return;
    Promise.all(logs.map((log) => idbPut("logs", log))).catch(console.error);
  }, [logs, ready]);

  useEffect(() => {
    if (!ready || skipPersist.current) return;
    Promise.all(
      prepared.map((id) => idbPut("meta", { id: `prepared:${id}` }))
    ).catch(console.error);
  }, [prepared, ready]);

  const saveMedia = useCallback((item) => {
    persistMediaBlobs(item).catch(console.error);
    setLibrary((items) => {
      const exists = items.some((it) => it.id === item.id);
      return exists
        ? items.map((it) => (it.id === item.id ? item : it))
        : [...items, item];
    });
  }, []);

  const deleteMedia = useCallback((id) => {
    setLibrary((items) => {
      const target = items.find((item) => item.id === id);
      if (target) deleteMediaBlobs(target).catch(console.error);
      return items.filter((item) => item.id !== id);
    });
    idbDelete("library", id).catch(console.error);
  }, []);

  const savePlan = useCallback((plan) => {
    setPlans((items) => {
      const exists = items.some((it) => it.id === plan.id);
      return exists
        ? items.map((it) => (it.id === plan.id ? plan : it))
        : [...items, plan];
    });
  }, []);

  const deletePlan = useCallback((id) => {
    setPlans((items) => items.filter((plan) => plan.id !== id));
    setPrepared((ids) => ids.filter((planId) => planId !== id));
    idbDelete("plans", id).catch(console.error);
  }, []);

  const addLog = useCallback((log) => {
    setLogs((items) => [log, ...items]);
  }, []);

  const deleteLog = useCallback((id) => {
    setLogs((items) => items.filter((log) => log.id !== id));
    idbDelete("logs", id).catch(console.error);
  }, []);

  const setPreparedIds = useCallback((ids) => {
    setPrepared(ids);
  }, []);

  const mediaById = useMemo(() => {
    const map = new Map();
    library.forEach((item) => map.set(item.id, item));
    return map;
  }, [library]);

  const value = useMemo(
    () => ({
      ready,
      library,
      plans,
      logs,
      prepared,
      mediaById,
      saveMedia,
      deleteMedia,
      savePlan,
      deletePlan,
      addLog,
      deleteLog,
      setPreparedIds
    }),
    [
      ready,
      library,
      plans,
      logs,
      prepared,
      mediaById,
      saveMedia,
      deleteMedia,
      savePlan,
      deletePlan,
      addLog,
      deleteLog,
      setPreparedIds
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
