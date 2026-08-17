import { useEffect, useState } from "react";

const parse = () => {
  const raw = (window.location.hash || "#/").replace(/^#/, "") || "/";
  const [pathPart, queryPart = ""] = raw.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  return {
    path: `/${segments.join("/")}`,
    segments,
    query
  };
};

export function useHashRoute() {
  const [route, setRoute] = useState(parse);

  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = (to) => {
    if (window.location.hash === `#${to}`) {
      setRoute(parse());
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } else {
      window.location.hash = to;
    }
  };

  return { ...route, navigate };
}
