function eventTime(event) {
    const time = Date.parse(event?.date);
    return Number.isNaN(time) ? -Infinity : time;
}

export function groupPhotosByEvent(photos) {
    const map = {};
    photos.forEach(photo => {
        const id = photo.eventId;
        if (!map[id]) {
            map[id] = { eventId: id, event: photo.event, photos: [] };
        }
        map[id].photos.push(photo);
    });
    return Object.values(map).sort((a, b) => {
        const timeA = eventTime(a.event);
        const timeB = eventTime(b.event);
        if (timeA !== timeB) return timeB > timeA ? 1 : -1;
        return (a.event?.name || "").localeCompare(b.event?.name || "");
    });
}
