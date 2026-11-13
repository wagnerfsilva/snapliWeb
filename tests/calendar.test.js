import assert from "node:assert/strict";
import { test } from "node:test";
import { eachDayOfInterval, parseISO } from "date-fns";
import { dateKey, getCalendarRange, moveCalendar } from "../src/lib/calendar.js";

test("monthly calendar includes complete weeks and leap day", () => {
    const range = getCalendarRange(parseISO("2024-02-15"), "month");
    const days = eachDayOfInterval(range).map(dateKey);
    assert.equal(days[0], "2024-01-28");
    assert.equal(days.at(-1), "2024-03-02");
    assert.ok(days.includes("2024-02-29"));
    assert.equal(days.length % 7, 0);
});

test("weekly calendar crosses year boundaries without losing days", () => {
    const range = getCalendarRange(parseISO("2026-01-01"), "week");
    assert.equal(dateKey(range.start), "2025-12-28");
    assert.equal(dateKey(range.end), "2026-01-03");
    assert.equal(eachDayOfInterval(range).length, 7);
});

test("annual calendar includes every day of a leap year", () => {
    const range = getCalendarRange(parseISO("2024-06-30"), "year");
    assert.equal(dateKey(range.start), "2024-01-01");
    assert.equal(dateKey(range.end), "2024-12-31");
    assert.equal(eachDayOfInterval(range).length, 366);
});

test("navigation from month-end never skips the next month", () => {
    const next = moveCalendar(parseISO("2026-01-31"), "month", 1);
    assert.equal(dateKey(next), "2026-02-01");
    assert.equal(dateKey(moveCalendar(next, "month", -1)), "2026-01-01");
    assert.equal(dateKey(moveCalendar(parseISO("2026-12-31"), "month", 1)), "2027-01-01");
});

test("week and year navigation preserve their respective periods", () => {
    assert.equal(dateKey(moveCalendar(parseISO("2026-12-31"), "week", 1)), "2027-01-03");
    assert.equal(dateKey(moveCalendar(parseISO("2024-02-29"), "year", 1)), "2025-01-01");
});
