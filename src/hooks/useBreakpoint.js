import { useState, useEffect } from "react";

function useMediaQuery(query, initialValue) {
  const [matches, setMatches] = useState(
    typeof window !== "undefined" ? window.matchMedia(query).matches : initialValue
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export function useMobile() {
  return useMediaQuery("(max-width: 767px)", false);
}

export function useDesktop() {
  return useMediaQuery("(min-width: 900px)", true);
}

export function useTouchDevice() {
  return useMediaQuery("(hover: none)", false);
}
