import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            eventData: null,

            // Adiciona foto ao carrinho
            addPhoto: (photo, eventId, eventName, pricing = {}) => {
                const { items, eventData } = get();

                // Se o carrinho tem fotos de outro evento, limpa
                if (eventData && eventData.eventId !== eventId) {
                    set({
                        items: [photo],
                        eventData: {
                            eventId,
                            eventName,
                            pricePerPhoto: pricing.pricePerPhoto,
                            pricingPackages: pricing.pricingPackages,
                            allPhotosPrice: pricing.allPhotosPrice
                        },
                    });
                    return;
                }

                // Verifica se a foto já está no carrinho
                const exists = items.find((item) => item.id === photo.id);
                if (exists) {
                    return;
                }

                set({
                    items: [...items, photo],
                    eventData: eventData || {
                        eventId,
                        eventName,
                        pricePerPhoto: pricing.pricePerPhoto,
                        pricingPackages: pricing.pricingPackages,
                        allPhotosPrice: pricing.allPhotosPrice
                    },
                });
            },

            // Remove foto do carrinho
            removePhoto: (photoId) => {
                const { items } = get();
                const newItems = items.filter((item) => item.id !== photoId);

                set({
                    items: newItems,
                    eventData: newItems.length > 0 ? get().eventData : null,
                });
            },

            // Limpa todo o carrinho
            clearCart: () => {
                set({ items: [], eventData: null });
            },

            // Quantidade de itens no carrinho
            getItemCount: () => {
                return get().items.length;
            },

            // Calcula o melhor preço baseado nas opções disponíveis
            calculateBestPrice: (pricePerPhoto, pricingPackages = [], allPhotosPrice) => {
                const { items } = get();
                const photoCount = items.length;

                if (photoCount === 0) return 0;

                const prices = [];

                // Preço individual
                if (pricePerPhoto) {
                    prices.push(photoCount * parseFloat(pricePerPhoto));
                }

                // Preço por pacotes
                if (pricingPackages && pricingPackages.length > 0) {
                    // Ordena pacotes por quantidade (maior para menor)
                    const sortedPackages = [...pricingPackages].sort(
                        (a, b) => b.quantity - a.quantity
                    );

                    let remaining = photoCount;
                    let packagePrice = 0;

                    for (const pkg of sortedPackages) {
                        while (remaining >= pkg.quantity) {
                            packagePrice += parseFloat(pkg.price);
                            remaining -= pkg.quantity;
                        }
                    }

                    // Adiciona o preço individual para fotos restantes
                    if (remaining > 0 && pricePerPhoto) {
                        packagePrice += remaining * parseFloat(pricePerPhoto);
                    }

                    prices.push(packagePrice);
                }

                // Preço todas as fotos
                if (allPhotosPrice) {
                    prices.push(parseFloat(allPhotosPrice));
                }

                // Retorna o menor preço
                return prices.length > 0 ? Math.min(...prices) : 0;
            },

            // Obtém detalhes do cálculo de preço
            getPriceBreakdown: (pricePerPhoto, pricingPackages = [], allPhotosPrice) => {
                const { items } = get();
                const photoCount = items.length;

                if (photoCount === 0) {
                    return {
                        bestOption: null,
                        totalPrice: 0,
                        details: "",
                    };
                }

                const options = [];

                // Opção 1: Preço individual
                if (pricePerPhoto) {
                    const price = photoCount * parseFloat(pricePerPhoto);
                    options.push({
                        type: "individual",
                        price,
                        details: `${photoCount} foto${photoCount > 1 ? "s" : ""} × R$ ${parseFloat(pricePerPhoto).toFixed(2)}`,
                    });
                }

                // Opção 2: Pacotes
                if (pricingPackages && pricingPackages.length > 0) {
                    const sortedPackages = [...pricingPackages].sort(
                        (a, b) => b.quantity - a.quantity
                    );

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
                        options.push({
                            type: "package",
                            price: packagePrice,
                            details: usedPackages.join(" + "),
                        });
                    }
                }

                // Opção 3: Todas as fotos
                if (allPhotosPrice) {
                    options.push({
                        type: "all",
                        price: parseFloat(allPhotosPrice),
                        details: "Todas as fotos do evento",
                    });
                }

                // Se não houver opções, retorna valor padrão
                if (options.length === 0) {
                    return {
                        bestOption: "individual",
                        totalPrice: 0,
                        details: "Nenhum preço configurado",
                        allOptions: [],
                    };
                }

                // Encontra a melhor opção
                const bestOption = options.reduce((best, current) =>
                    current.price < best.price ? current : best
                );

                return {
                    bestOption: bestOption.type,
                    totalPrice: bestOption.price,
                    details: bestOption.details,
                    allOptions: options,
                };
            },
        }),
        {
            name: "fotow-cart",
            getStorage: () => localStorage,
        }
    )
);

export default useCartStore;
