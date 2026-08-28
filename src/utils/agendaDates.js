export function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export function eventsForDay(agenda, prefix) {
  return (agenda || []).filter(ev => ev.start && String(ev.start).startsWith(prefix));
}

export function monthDayPrefix(year, month, dayNum) {
  const y = String(year);
  const m = String(month + 1).padStart(2, '0');
  const d = String(dayNum).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
