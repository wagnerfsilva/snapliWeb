import { create } from "zustand";
import { persist } from "zustand/middleware";

// Calcula o melhor preço para um conjunto de fotos dado o pricing de um evento
function calcBestPriceForGroup(photoCount, pricePerPhoto, pricingPackages = [], allPhotosPrice, freePhotosCount = 0) {
    if (photoCount === 0) return 0;

    // Fotos grátis não entram no cálculo de pacotes/individual; sempre sobra ao menos 1 foto paga
    const freeCount = Math.max(0, Math.min(freePhotosCount || 0, photoCount - 1));
    const paidCount = photoCount - freeCount;

    const prices = [];

    if (pricePerPhoto) {
        prices.push(paidCount * parseFloat(pricePerPhoto));
    }

    if (pricingPackages && pricingPackages.length > 0) {
        const sortedPackages = [...pricingPackages].sort((a, b) => b.quantity - a.quantity);
        let remaining = paidCount;
        let packagePrice = 0;
        for (const pkg of sortedPackages) {
            while (remaining >= pkg.quantity) {
                packagePrice += parseFloat(pkg.price);
                remaining -= pkg.quantity;
            }
        }
        if (remaining > 0 && pricePerPhoto) {
            packagePrice += remaining * parseFloat(pricePerPhoto);
        }
        prices.push(packagePrice);
    }

    if (allPhotosPrice) {
        prices.push(parseFloat(allPhotosPrice));
    }

    return prices.length > 0 ? Math.min(...prices) : 0;
}

// Gera breakdown detalhado para um grupo de fotos
export function calcBreakdownForGroup(photoCount, pricePerPhoto, pricingPackages = [], allPhotosPrice, freePhotosCount = 0, mediaType = "photo") {
    if (photoCount === 0) {
        return { bestOption: null, totalPrice: 0, details: "", allOptions: [] };
    }

    // Fotos grátis não entram no cálculo de pacotes/individual; sempre sobra ao menos 1 foto paga
    const freeCount = Math.max(0, Math.min(freePhotosCount || 0, photoCount - 1));
    const paidCount = photoCount - freeCount;
    const itemLabel = mediaType === "video" ? "vídeo" : "foto";

    const options = [];

    if (pricePerPhoto) {
        const price = paidCount * parseFloat(pricePerPhoto);
        options.push({
            type: "individual",
            price,
            details: `${paidCount} ${itemLabel}${paidCount > 1 ? "s" : ""} × R$ ${parseFloat(pricePerPhoto).toFixed(2)}`,
        });
    }

    if (pricingPackages && pricingPackages.length > 0) {
        const sortedPackages = [...pricingPackages].sort((a, b) => b.quantity - a.quantity);
        let remaining = paidCount;
        let packagePrice = 0;
        const usedPackages = [];
        for (const pkg of sortedPackages) {
            let count = 0;
            while (remaining >= pkg.quantity) {
                packagePrice += parseFloat(pkg.price);
                remaining -= pkg.quantity;
                count++;
            }
            if (count > 0) {
                usedPackages.push(`${count}x pacote de ${pkg.quantity} ${itemLabel}s`);
            }
        }
        if (remaining > 0 && pricePerPhoto) {
            packagePrice += remaining * parseFloat(pricePerPhoto);
            usedPackages.push(`${remaining} ${itemLabel}${remaining > 1 ? "s" : ""} ${mediaType === "video" ? "avulso" : "avulsa"}${remaining > 1 ? "s" : ""}`);
        }
        if (usedPackages.length > 0) {
            options.push({ type: "package", price: packagePrice, details: usedPackages.join(" + ") });
        }
    }

    if (allPhotosPrice) {
        options.push({ type: "all", price: parseFloat(allPhotosPrice), details: mediaType === "video" ? "Todos os vídeos do evento" : "Todas as fotos do evento" });
    }

    if (options.length === 0) {
        return { bestOption: "individual", totalPrice: 0, details: "Nenhum preço configurado", allOptions: [] };
    }

    const best = options.reduce((b, c) => (c.price < b.price ? c : b));
    const freePrefix = freeCount > 0 ? `${freeCount} ${itemLabel}${freeCount > 1 ? "s" : ""} grátis + ` : "";
    return { bestOption: best.type, totalPrice: best.price, details: `${freePrefix}${best.details}`, allOptions: options };
}

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            // Mapa de eventId → { eventId, eventName, pricePerPhoto, pricingPackages, allPhotosPrice }
            events: {},

            // Adiciona foto ao carrinho (suporta múltiplos eventos)
            addPhoto: (photo, eventId, eventName, pricing = {}) => {
                const { items, events } = get();

                // Verifica se a foto já está no carrinho
                if (items.find((item) => item.id === photo.id)) return;

                set({
                    items: [...items, { ...photo, mediaType: photo.mediaType || "photo" }],
                    events: {
                        ...events,
                        [eventId]: {
                            eventId,
                            eventName,
                            pricePerPhoto: pricing.pricePerPhoto,
                            pricingPackages: pricing.pricingPackages,
                            allPhotosPrice: pricing.allPhotosPrice,
                            freePhotosCount: pricing.freePhotosCount,
                            videoEnabled: pricing.videoEnabled ?? photo.event?.videoEnabled ?? events[eventId]?.videoEnabled,
                            pricePerVideo: pricing.pricePerVideo ?? photo.event?.pricePerVideo ?? events[eventId]?.pricePerVideo,
                            videoPricingPackages: pricing.videoPricingPackages ?? photo.event?.videoPricingPackages ?? events[eventId]?.videoPricingPackages,
                            allVideosPrice: pricing.allVideosPrice ?? photo.event?.allVideosPrice ?? events[eventId]?.allVideosPrice,
                        },
                    },
                });
            },

            // Remove foto do carrinho; remove evento do mapa se ficou sem fotos
            removePhoto: (photoId) => {
                const { items, events } = get();
                const removedPhoto = items.find((item) => item.id === photoId);
                const newItems = items.filter((item) => item.id !== photoId);

                let newEvents = { ...events };
                if (removedPhoto) {
                    const stillHasPhotosForEvent = newItems.some(
                        (item) => item.eventId === removedPhoto.eventId
                    );
                    if (!stillHasPhotosForEvent) {
                        delete newEvents[removedPhoto.eventId];
                    }
                }

                set({ items: newItems, events: newEvents });
            },

            // Limpa todo o carrinho
            clearCart: () => {
                set({ items: [], events: {} });
            },

            // Quantidade total de itens
            getItemCount: () => get().items.length,

            // Total geral somando o melhor preço de cada evento
            getTotalPrice: () => {
                return Math.round(get().getPriceBreakdownPerEvent().reduce((total, group) => total + group.breakdown.totalPrice, 0) * 100) / 100;
            },

            // Breakdown por evento — retorna array de { eventId, eventName, photoCount, breakdown }
            getPriceBreakdownPerEvent: () => {
                const { items, events } = get();
                return Object.values(events).flatMap(ev => ["photo", "video"].flatMap(mediaType => {
                    const media = items.filter(item => item.eventId === ev.eventId && (item.mediaType || "photo") === mediaType);
                    if (!media.length) return [];
                    const isVideo = mediaType === "video";
                    const breakdown = calcBreakdownForGroup(media.length, isVideo ? ev.pricePerVideo : ev.pricePerPhoto, isVideo ? ev.videoPricingPackages : ev.pricingPackages, isVideo ? ev.allVideosPrice : ev.allPhotosPrice, ev.freePhotosCount, mediaType);
                    return [{ eventId: ev.eventId, eventName: ev.eventName, mediaType, groupKey: `${ev.eventId}:${mediaType}`, itemCount: media.length, photoCount: mediaType === "photo" ? media.length : 0, videoCount: mediaType === "video" ? media.length : 0, breakdown }];
                }));
            },

            // Calcula o melhor preço para um dado grupo (usado externamente se necessário)
            calculateBestPrice: (pricePerPhoto, pricingPackages = [], allPhotosPrice) => {
                const { items } = get();
                return calcBestPriceForGroup(items.length, pricePerPhoto, pricingPackages, allPhotosPrice);
            },

            // Obtém detalhes do cálculo de preço (compatibilidade — usa todos os itens)
            getPriceBreakdown: (pricePerPhoto, pricingPackages = [], allPhotosPrice) => {
                const { items } = get();
                return calcBreakdownForGroup(items.length, pricePerPhoto, pricingPackages, allPhotosPrice);
            },
        }),
        {
            name: "snapli-cart-v2",
            version: 1,
            migrate: state => ({ ...state, items: (state.items || []).map(item => ({ ...item, mediaType: item.mediaType || "photo" })) }),
        }
    )
);

export default useCartStore;
