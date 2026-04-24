import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS } from "../theme";

const AUTOPLAY_INTERVAL = 5000;

export default function VillaCarousel({ photos }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const goTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || paused) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [emblaApi, paused]);

  const onKey = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  const btnStyle = (side) => ({
    position: "absolute",
    top: "50%",
    [side]: 16,
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(26,31,58,0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s ease",
    cursor: "pointer",
  });

  return (
    <div
      style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: "clamp(300px, 46vw, 480px)", boxShadow: "0 30px 60px rgba(38,70,83,0.2)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={onKey}
      tabIndex={0}
      role="region"
      aria-label="Villa photos"
    >
      <div ref={emblaRef} style={{ overflow: "hidden", height: "100%" }}>
        <div style={{ display: "flex", height: "100%" }}>
          {photos.map((photo, i) => (
            <div key={i} style={{ flex: "0 0 100%", minWidth: 0, position: "relative" }}>
              <img
                src={photo.src}
                alt={photo.alt}
                loading={i === 0 ? "eager" : "lazy"}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlay */}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(26,31,58,0.15) 0%, rgba(26,31,58,0.25) 55%, rgba(26,31,58,0.75) 100%)", pointerEvents: "none" }} />

      {/* Prev / Next */}
      <button onClick={prev} aria-label="Previous photo" style={btnStyle("left")} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(26,31,58,0.8)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(26,31,58,0.55)")}>
        <ChevronLeft size={20} color="#fff" />
      </button>
      <button onClick={next} aria-label="Next photo" style={btnStyle("right")} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(26,31,58,0.8)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(26,31,58,0.55)")}>
        <ChevronRight size={20} color="#fff" />
      </button>

      {/* Dots */}
      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 7, zIndex: 2 }}>
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to photo ${i + 1}`}
            style={{
              width: i === current ? 20 : 8,
              height: 8,
              borderRadius: 999,
              background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
              transition: "width 0.25s ease, background 0.2s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
