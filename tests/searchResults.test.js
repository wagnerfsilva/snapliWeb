import assert from "node:assert/strict";
import { test } from "node:test";
import { groupPhotosByEvent } from "../src/lib/searchResults.js";

test("groups photos and videos in newest-first event tabs without changing result order", () => {
    const older = { id: "older", name: "Evento anterior", date: "2026-10-01" };
    const newer = { id: "newer", name: "Evento recente", date: "2026-11-13" };
    const photos = [
        { id: "old-photo", eventId: older.id, event: older, mediaType: "photo" },
        { id: "new-video", eventId: newer.id, event: newer, mediaType: "video" },
        { id: "new-photo", eventId: newer.id, event: newer, mediaType: "photo" },
    ];
    const snapshot = structuredClone(photos);
    const groups = groupPhotosByEvent(photos);
    assert.deepEqual(groups.map(group => group.eventId), ["newer", "older"]);
    assert.deepEqual(groups[0].photos.map(photo => photo.id), ["new-video", "new-photo"]);
    assert.deepEqual(photos, snapshot);
});

test("sorts undated events after dated ones and breaks date ties by event name", () => {
    const photos = [
        { eventId: "undated", event: { name: "Sem data", date: "invalid" } },
        { eventId: "beta", event: { name: "Beta", date: "2026-11-13" } },
        { eventId: "alpha", event: { name: "Alpha", date: "2026-11-13" } },
    ];
    assert.deepEqual(groupPhotosByEvent(photos).map(group => group.eventId), ["alpha", "beta", "undated"]);
    assert.deepEqual(groupPhotosByEvent([]), []);
});
