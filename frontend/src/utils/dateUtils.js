import { format, startOfWeek, addDays, isToday, parseISO } from 'date-fns';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const getWeekDays = (referenceDate = new Date()) => {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

export const formatDate = (date, fmt = 'yyyy-MM-dd') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
};

export const formatDisplayDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
};

export const isTodayDate = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
};

export const getDayName = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE');
};

export const getMonthYear = (date = new Date()) => ({
  month: date.getMonth() + 1,
  year: date.getFullYear(),
  monthName: format(date, 'MMMM'),
});

export const minutesToHours = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
