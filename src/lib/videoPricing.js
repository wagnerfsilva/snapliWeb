export function videoBreakdown(count, event) {
  if (!count) return { totalPrice: 0, details: "", allOptions: [] };
  const unit = Math.round(Number(event.pricePerVideo) * 100);
  if (!Number.isSafeInteger(unit) || unit <= 0) return { totalPrice: 0, details: "Vídeos sem preço configurado", allOptions: [] };
  const costs = Array(count + 1).fill(Infinity);
  costs[0] = 0;
  for (let quantity = 1; quantity <= count; quantity++) {
    costs[quantity] = costs[quantity - 1] + unit;
    for (const pack of event.videoPricingPackages || []) {
      if (Number.isInteger(pack.quantity) && pack.quantity > 0 && pack.quantity <= quantity && Number(pack.price) > 0) {
        costs[quantity] = Math.min(costs[quantity], costs[quantity - pack.quantity] + Math.round(Number(pack.price) * 100));
      }
    }
  }
  const ceiling = event.allVideosPrice ? Math.round(Number(event.allVideosPrice) * 100) : Infinity;
  return { bestOption: "video", totalPrice: Math.min(costs[count], ceiling) / 100, details: `${count} vídeo${count > 1 ? "s" : ""}`, allOptions: [] };
}