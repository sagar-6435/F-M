import { Link } from "react-router-dom";
import { Volume2, VolumeX, Check, Film, ArrowRight } from "lucide-react";
import type { BookingData, ExtraDecoration } from "@/lib/booking-data";
import { getEffectivePrice, getOriginalPrice, hasOffer } from "@/lib/utils";

interface DecorationsStepProps {
  booking: BookingData;
  decorations: ExtraDecoration[];
  stepLoading: boolean;
  decorationMuted: Record<string, boolean>;
  setDecorationMuted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  update: (partial: Partial<BookingData>) => void;
}

const DecorationsStep = ({ booking, decorations, stepLoading, decorationMuted, setDecorationMuted, update }: DecorationsStepProps) => {
  return (
    <div className="space-y-4">
      {stepLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground font-body animate-pulse">Loading decorations...</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground font-body">Select any extras to add to your experience</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decorations.map((item) => {
              const selected = booking.extraDecorations.some((d) => d.id === item.id);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    const extras = selected
                      ? booking.extraDecorations.filter((d) => d.id !== item.id)
                      : [...booking.extraDecorations, item];
                    update({ extraDecorations: extras });
                  }}
                  onClick={() => {
                    const extras = selected
                      ? booking.extraDecorations.filter((d) => d.id !== item.id)
                      : [...booking.extraDecorations, item];
                    update({ extraDecorations: extras });
                  }}
                  className={`rounded-xl border overflow-hidden transition-all text-left ${selected ? "border-primary bg-muted shadow-md ring-1 ring-primary/30" : "border-border hover:border-primary"
                    }`}
                >
                  <div className="aspect-square bg-muted overflow-hidden relative">
                    {item.video ? (
                      <>
                        <video
                          src={item.video}
                          autoPlay
                          muted={decorationMuted[item.id] !== false}
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDecorationMuted((prev) => ({ ...prev, [item.id]: prev[item.id] === false }));
                          }}
                          className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm"
                        >
                          {decorationMuted[item.id] === false ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                          {decorationMuted[item.id] === false ? "Mute" : "Unmute"}
                        </button>
                      </>
                    ) : item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-body">No image</div>
                    )}
                    {selected && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-foreground text-sm font-body">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body line-clamp-1 mt-0.5">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      {hasOffer(item) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-500 font-body">₹{getEffectivePrice(item)}</span>
                          <span className="text-[10px] line-through text-muted-foreground font-body">₹{getOriginalPrice(item)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-primary font-body">₹{item.price}</span>
                      )}
                      {selected && <span className="text-[10px] font-semibold text-primary">Added ✓</span>}
                    </div>
                    {item.video && (
                      <Link
                        to="/reels"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Film className="h-3.5 w-3.5" />
                        More Reels
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DecorationsStep;
