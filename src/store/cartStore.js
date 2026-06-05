import { create } from "zustand";
import { persist } from "zustand/middleware";

// Calcula o melhor preço para um conjunto de fotos dado o pricing de um evento
function calcBestPriceForGroup(photoCount, pricePerPhoto, pricingPackages = [], allPhotosPrice) {
    if (photoCount === 0) return 0;

    const prices = [];

    if (pricePerPhoto) {
        prices.push(photoCount * parseFloat(pricePerPhoto));
    }

    if (pricingPackages && pricingPackages.length > 0) {
        const sortedPackages = [...pricingPackages].sort((a, b) => b.quantity - a.quantity);
        let remaining = photoCount;
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
function calcBreakdownForGroup(photoCount, pricePerPhoto, pricingPackages = [], allPhotosPrice) {
    if (photoCount === 0) {
        return { bestOption: null, totalPrice: 0, details: "", allOptions: [] };
    }

    const options = [];

    if (pricePerPhoto) {
        const price = photoCount * parseFloat(pricePerPhoto);
        options.push({
            type: "individual",
            price,
            details: `${photoCount} foto${photoCount > 1 ? "s" : ""} × R$ ${parseFloat(pricePerPhoto).toFixed(2)}`,
        });
    }

    if (pricingPackages && pricingPackages.length > 0) {
        const sortedPackages = [...pricingPackages].sort((a, b) => b.quantity - a.quantity);
        let remaining = photoCount;
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
                usedPackages.push(`${count}x pacote de ${pkg.quantity} fotos`);
            }
        }
        if (remaining > 0 && pricePerPhoto) {
            packagePrice += remaining * parseFloat(pricePerPhoto);
            usedPackages.push(`${remaining} foto${remaining > 1 ? "s" : ""} avulsa${remaining > 1 ? "s" : ""}`);
        }
        if (usedPackages.length > 0) {
            options.push({ type: "package", price: packagePrice, details: usedPackages.join(" + ") });
        }
    }

    if (allPhotosPrice) {
        options.push({ type: "all", price: parseFloat(allPhotosPrice), details: "Todas as fotos do evento" });
    }

    if (options.length === 0) {
        return { bestOption: "individual", totalPrice: 0, details: "Nenhum preço configurado", allOptions: [] };
    }

    const best = options.reduce((b, c) => (c.price < b.price ? c : b));
    return { bestOption: best.type, totalPrice: best.price, details: best.details, allOptions: options };
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
                    items: [...items, photo],
                    events: {
                        ...events,
                        [eventId]: {
                            eventId,
                            eventName,
                            pricePerPhoto: pricing.pricePerPhoto,
                            pricingPackages: pricing.pricingPackages,
                            allPhotosPrice: pricing.allPhotosPrice,
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
                const { items, events } = get();
                if (items.length === 0) return 0;

                return Object.values(events).reduce((total, ev) => {
                    const photosInEvent = items.filter((item) => item.eventId === ev.eventId);
                    return total + calcBestPriceForGroup(
                        photosInEvent.length,
                        ev.pricePerPhoto,
                        ev.pricingPackages,
                        ev.allPhotosPrice
                    );
                }, 0);
            },

            // Breakdown por evento — retorna array de { eventId, eventName, photoCount, breakdown }
            getPriceBreakdownPerEvent: () => {
                const { items, events } = get();
                return Object.values(events).map((ev) => {
                    const photosInEvent = items.filter((item) => item.eventId === ev.eventId);
                    const breakdown = calcBreakdownForGroup(
                        photosInEvent.length,
                        ev.pricePerPhoto,
                        ev.pricingPackages,
                        ev.allPhotosPrice
                    );
                    return { eventId: ev.eventId, eventName: ev.eventName, photoCount: photosInEvent.length, breakdown };
                });
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
        }
    )
);

export default useCartStore;
