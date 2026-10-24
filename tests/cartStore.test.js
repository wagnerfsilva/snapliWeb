import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
};

const { default: useCartStore } = await import("../src/store/cartStore.js");

beforeEach(() => useCartStore.getState().clearCart());

function addMedia(eventId, mediaType, count, pricing) {
    for (let index = 0; index < count; index++) {
        useCartStore.getState().addPhoto(
            { id: `${eventId}:${mediaType}:${index}`, eventId, mediaType },
            eventId,
            eventId,
            pricing,
        );
    }
}

for (const configuration of [
    { freePhotosCount: 3, photoTotal: 5, videoTotal: 40 },
    { freePhotosCount: 3, freeVideosCount: 0, photoTotal: 5, videoTotal: 40 },
    { freePhotosCount: 0, freeVideosCount: 3, photoTotal: 20, videoTotal: 10 },
    { freePhotosCount: 3, freeVideosCount: 1, photoTotal: 5, videoTotal: 30 },
]) {
    test(`isolates cart promotions: ${JSON.stringify(configuration)}`, () => {
        const pricing = { pricePerPhoto: 5, pricePerVideo: 10, ...configuration };
        addMedia("event", "photo", 4, pricing);
        addMedia("event", "video", 4, pricing);
        const groups = useCartStore.getState().getPriceBreakdownPerEvent();
        assert.equal(groups.find(group => group.mediaType === "photo").breakdown.totalPrice, configuration.photoTotal);
        assert.equal(groups.find(group => group.mediaType === "video").breakdown.totalPrice, configuration.videoTotal);
        assert.equal(useCartStore.getState().getTotalPrice(), configuration.photoTotal + configuration.videoTotal);
    });
}

test("a single item of each type remains paid even with both promotions", () => {
    const pricing = { pricePerPhoto: 5, pricePerVideo: 10, freePhotosCount: 3, freeVideosCount: 3 };
    addMedia("event", "photo", 1, pricing);
    addMedia("event", "video", 1, pricing);
    assert.equal(useCartStore.getState().getTotalPrice(), 15);
});

test("video packages are calculated without photo freebies", () => {
    addMedia("event", "video", 4, {
        pricePerVideo: 10,
        freePhotosCount: 3,
        videoPricingPackages: [{ quantity: 3, price: 25 }],
    });
    assert.equal(useCartStore.getState().getTotalPrice(), 35);
    assert.doesNotMatch(useCartStore.getState().getPriceBreakdownPerEvent()[0].breakdown.details, /grátis/);
});

test("promotions stay within their event", () => {
    addMedia("event1", "video", 4, { pricePerVideo: 10, freeVideosCount: 3 });
    addMedia("event2", "video", 4, { pricePerVideo: 10, freePhotosCount: 3 });
    assert.equal(useCartStore.getState().getTotalPrice(), 50);
});

test("old persisted carts never convert photo freebies into video freebies", () => {
    useCartStore.setState({
        events: { event: { eventId: "event", pricePerVideo: 10, freePhotosCount: 3 } },
        items: Array.from({ length: 4 }, (_, index) => ({ id: `video${index}`, eventId: "event", mediaType: "video" })),
    });
    assert.equal(useCartStore.getState().getTotalPrice(), 40);
});
