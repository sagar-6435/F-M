import { Check } from "lucide-react";
import type { BookingData, CakeOption } from "@/lib/booking-data";
import { getEffectivePrice, getOriginalPrice, hasOffer } from "@/lib/utils";

interface CakeStepProps {
  booking: BookingData;
  cakes: CakeOption[];
  stepLoading: boolean;
  update: (partial: Partial<BookingData>) => void;
}

const CakeStep = ({ booking, cakes, stepLoading, update }: CakeStepProps) => {
  return (
    <div className="space-y-6">
      {stepLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground font-body animate-pulse">Loading cakes...</p>
        </div>
      ) : (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground font-body">Would you like a cake?</label>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => update({ cakeRequired: val, selectedCake: val ? booking.selectedCake : null })}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all font-body ${booking.cakeRequired === val ? "border-primary bg-muted text-primary" : "border-border text-foreground hover:border-primary/50"
                    }`}
                >
                  {val ? "Yes" : "No, thanks"}
                </button>
              ))}
            </div>
          </div>
          {booking.cakeRequired && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cakes.map((cake) => {
                const variants = cake.variants || [{ quantity: cake.quantity || '1kg', price: cake.price, offerPrice: cake.offerPrice }];
                const selectedVariant = booking.selectedCake?.id === cake.id
                  ? variants.find(v => v.quantity === booking.selectedCake?.quantity) || variants[0]
                  : variants[0];

                return (
                  <div
                    key={cake.id}
                    className={`rounded-xl border overflow-hidden transition-all text-left flex flex-col ${booking.selectedCake?.id === cake.id ? "border-primary bg-muted shadow-md" : "border-border hover:border-primary"
                      }`}
                  >
                    <div
                      className="aspect-square bg-muted overflow-hidden relative cursor-pointer"
                      onClick={() => update({ selectedCake: { ...cake, ...selectedVariant } })}
                    >
                      {cake.image ? (
                        <img src={cake.image} alt={cake.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-body">No image</div>
                      )}
                      <div className="absolute top-2 right-2 bg-primary/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {selectedVariant.quantity}
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="font-bold text-foreground text-sm font-body">{cake.name}</p>
                      <p className="text-[10px] text-muted-foreground font-body line-clamp-1 mb-2">{cake.description}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {variants.map((v, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              update({ selectedCake: { ...cake, ...v } });
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              booking.selectedCake?.id === cake.id && booking.selectedCake.quantity === v.quantity
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {v.quantity}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-auto">
                        {hasOffer(selectedVariant) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-500 font-body">₹{getEffectivePrice(selectedVariant)}</span>
                            <span className="text-[10px] line-through text-muted-foreground font-body">₹{getOriginalPrice(selectedVariant)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-primary font-body">₹{selectedVariant.price}</span>
                        )}
                        {booking.selectedCake?.id === cake.id && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CakeStep;
