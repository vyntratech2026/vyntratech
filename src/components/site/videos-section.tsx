import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { publicVideosQuery, useVideoUrls } from "@/lib/videos";
import { cn } from "@/lib/utils";
import { useCompany } from "@/lib/brand";

/** Reel of the shop's videos: plays muted on loop while visible, swipeable on phones. */
export function VideosSection() {
  const { data: videos } = useQuery(publicVideosQuery(useCompany().id));
  const urls = useVideoUrls(videos?.map((v) => v.video_path) ?? []);
  const scroller = useRef<HTMLDivElement>(null);

  if (!videos?.length) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section id="videos" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="eyebrow">Por dentro do Studio</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Vídeos</h2>
          </div>
          {videos.length > 1 && (
            <div className="hidden gap-2 sm:flex">
              <button aria-label="Vídeos anteriores" onClick={() => scrollBy(-1)} className="rounded-full border border-border p-2.5 hover:border-primary hover:text-primary">
                <ChevronLeft className="size-5" />
              </button>
              <button aria-label="Próximos vídeos" onClick={() => scrollBy(1)} className="rounded-full border border-border p-2.5 hover:border-primary hover:text-primary">
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </div>
        <div ref={scroller} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {videos.map((v) => (
            <VideoCard key={v.id} src={urls.data?.[v.video_path]} title={v.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoCard({ src, title }: { src: string | undefined; title: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <figure className="surface-card relative aspect-[9/16] w-[72%] shrink-0 snap-center overflow-hidden sm:w-[280px]">
      {src ? (
        <video ref={ref} src={src} muted={muted} loop playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse bg-surface-raised" />
      )}
      <button
        aria-label={muted ? "Ativar som" : "Tirar som"}
        onClick={() => setMuted((m) => !m)}
        className={cn("absolute right-3 top-3 rounded-full bg-background/70 p-2 backdrop-blur", !muted && "text-primary")}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      {title && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-hero-overlay p-4 pt-12 text-sm font-semibold">{title}</figcaption>
      )}
    </figure>
  );
}
