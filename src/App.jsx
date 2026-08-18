import { useEffect } from "react";
import { StoreProvider } from "./lib/store.jsx";
import { useHashRoute } from "./lib/router.jsx";
import { AppShell } from "./components/AppShell.jsx";
import { HomeView } from "./views/HomeView.jsx";
import { SessionPlansView } from "./views/SessionPlansView.jsx";
import { PlanBuilderView } from "./views/PlanBuilderView.jsx";
import { LibraryView } from "./views/LibraryView.jsx";
import { SessionLogView } from "./views/SessionLogView.jsx";
import { SessionPlayerView } from "./views/SessionPlayerView.jsx";
import { MediaDetailView } from "./views/MediaDetailView.jsx";
import { AdminView } from "./views/AdminView.jsx";
import { UpdateBanner } from "./components/UpdateBanner.jsx";

function RedirectTo({ to, navigate }) {
  useEffect(() => {
    navigate(to);
  }, [to, navigate]);
  return null;
}

function renderRoute(route, navigate) {
  const [first, second] = route.segments;
  if (!first) return <HomeView navigate={navigate} />;
  if (first === "plans" && second === "new") {
    return <PlanBuilderView navigate={navigate} />;
  }
  if (first === "plans" && second) {
    return <PlanBuilderView planId={second} navigate={navigate} />;
  }
  if (first === "plans") return <SessionPlansView navigate={navigate} />;
  if (first === "library") return <LibraryView navigate={navigate} />;
  if (first === "explore") return <RedirectTo to="/library" navigate={navigate} />;
  if (first === "logs") return <SessionLogView navigate={navigate} />;
  if (first === "player" && second) {
    return <SessionPlayerView planId={second} navigate={navigate} />;
  }
  if (first === "media" && second) {
    return <MediaDetailView mediaId={second} navigate={navigate} />;
  }
  if (first === "admin") return <AdminView />;
  return <HomeView navigate={navigate} />;
}

export default function App() {
  const route = useHashRoute();
  const { navigate } = route;
  return (
    <StoreProvider>
      <UpdateBanner />
      <AppShell route={route} navigate={navigate}>
        {renderRoute(route, navigate)}
      </AppShell>
    </StoreProvider>
  );
}
