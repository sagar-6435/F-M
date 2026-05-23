import { useEffect, useState } from "react";
import { Film, Loader2, Volume2, VolumeX } from "lucide-react";
import { api, type ReelVideo } from "@/lib/api";

const Reels = () => {
  const [reels, setReels] = useState<ReelVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unmutedId, setUnmutedId] = useState<string | null>(null);

  useEffect(() => {
    const loadReels = async () => {
      try {
        setLoading(true);
        setError("");
        setReels(await api.getReels("all"));
      } catch (err) {
        console.error("Failed to load reels:", err);
        setError("Failed to load reels");
      } finally {
        setLoading(false);
      }
    };

    loadReels();
  }, []);

  return (
    <main className="min-h-screen bg-background pt-24 pb-10">
      <section className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Reels Are Real Memories</p>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Friends & Memories <span className="text-gradient-gold">Reels</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-body">Loading reels...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-red-500 font-body">{error}</div>
        ) : reels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Film className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground font-body">No reels found in Cloudinary yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reels.map((reel) => {
              const isUnmuted = unmutedId === reel.id;
              return (
                <article key={reel.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                  <div className="relative aspect-[9/16] bg-black">
                    <video
                      src={reel.url}
                      autoPlay
                      muted={!isUnmuted}
                      loop
                      playsInline
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setUnmutedId(isUnmuted ? null : reel.id)}
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/85"
                    >
                      {isUnmuted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      {isUnmuted ? "Mute" : "Unmute"}
                    </button>
                  </div>
                  <div className="p-4">
                    <h2 className="truncate text-sm font-semibold text-foreground font-body">{reel.title || "Reel"}</h2>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body">
                      {reel.branch === "branch-2" ? "Bhimavaram" : "Eluru"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default Reels;
