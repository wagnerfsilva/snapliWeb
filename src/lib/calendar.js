import {
    addMonths, addWeeks, addYears, endOfMonth, endOfWeek, endOfYear,
    format, startOfMonth, startOfWeek, startOfYear,
} from 'date-fns';

export const dateKey = date => format(date, 'yyyy-MM-dd');

export function getCalendarRange(date, view) {
    if (view === 'year') return { start: startOfYear(date), end: endOfYear(date) };
    if (view === 'week') return { start: startOfWeek(date), end: endOfWeek(date) };
    return {
        start: startOfWeek(startOfMonth(date)),
        end: endOfWeek(endOfMonth(date)),
    };
}

export function moveCalendar(date, view, direction) {
    if (view === 'year') return addYears(startOfYear(date), direction);
    if (view === 'week') return addWeeks(startOfWeek(date), direction);
    return addMonths(startOfMonth(date), direction);
}
