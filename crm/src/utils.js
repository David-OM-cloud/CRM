// Утилиты дат и периодичностей

export const PERIODS = [
  { value: 'none', label: 'Без периода' },
  { value: 'once', label: 'Разово' },
  { value: 'week', label: 'Еженедельно' },
  { value: '2weeks', label: 'Раз в 2 недели' },
  { value: 'month', label: 'Ежемесячно' },
  { value: 'quarter', label: 'Ежеквартально' },
  { value: 'halfyear', label: 'Раз в полгода' },
  { value: 'year', label: 'Ежегодно' },
];

// Добавить месяцы к дате (с обрезкой дня, если месяц короче)
function addMonths(date, months) {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

export function addPeriod(date, period) {
  if (!date || !period || period === 'none' || period === 'once') return null;
  const d = new Date(date.getTime());
  switch (period) {
    case 'week': d.setDate(d.getDate() + 7); return d;
    case '2weeks': d.setDate(d.getDate() + 14); return d;
    case 'month': return addMonths(d, 1);
    case 'quarter': return addMonths(d, 3);
    case 'halfyear': return addMonths(d, 6);
    case 'year': return addMonths(d, 12);
    default: return null;
  }
}

// Автопересчёт даты окончания по дате начала и периодичности.
// Для бессрочных ('none') — дата окончания не вычисляется.
export function computeEndDate(startDateStr, period) {
  if (!startDateStr || period === 'none') return '';
  const end = addPeriod(parseDate(startDateStr), period);
  return end ? toISODate(end) : '';
}

// Предстоящая дата платежа: ближайшая дата >= сегодня,
// рассчитанная от даты начала (или окончания) с шагом периодичности.
export function computeNextPayment(item) {
  const { startDate, endDate, period } = item;
  if (!period || period === 'none' || period === 'once') {
    return endDate || startDate || '';
  }
  const base = parseDate(startDate || endDate);
  if (!base) return '';
  const today = startOfDay(new Date());
  let next = new Date(base.getTime());
  // ограничитель итераций на случай некорректных данных
  for (let i = 0; i < 5000 && next < today; i++) {
    const nn = addPeriod(next, period);
    if (!nn) break;
    next = nn;
  }
  return toISODate(next);
}

export function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(d) {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysUntil(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  return Math.round((d - startOfDay(new Date())) / 86400000);
}

export function fmtDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '—';
  return d.toLocaleDateString('ru-RU');
}

export function fmtMoney(n) {
  if (n === '' || n === null || n === undefined || isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ₽';
}
