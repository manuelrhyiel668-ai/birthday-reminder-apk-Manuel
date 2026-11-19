import type { Birthday } from './types';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const RELATIONSHIPS = ['Friends', 'Family', 'Work', 'Other'] as const;
export const COLORS = ['peach', 'sage', 'lavender', 'butter', 'rose', 'sky'];
export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const initials = (name: string) => name.trim().split(/\s+/).map(n => [...n][0]).slice(0, 2).join('').toUpperCase();
export const firstName = (name: string) => name.split(' ')[0];
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function birthdayInYear(b: Pick<Birthday, 'month' | 'day'>, year: number) {
  // Leap-day birthdays are celebrated on the last day of February every year.
  const day = Math.min(b.day, new Date(year, b.month, 0).getDate());
  return new Date(year, b.month - 1, day);
}

export function nextBirthday(b: Birthday, now = new Date()) {
  const today = startOfDay(now);
  let next = birthdayInYear(b, today.getFullYear());
  if (next < today) next = birthdayInYear(b, today.getFullYear() + 1);
  return next;
}

export function daysUntil(b: Birthday, now = new Date()) {
  const next = nextBirthday(b, now);
  return Math.round((Date.UTC(next.getFullYear(), next.getMonth(), next.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

export function turningAge(b: Birthday, now = new Date()) {
  return b.year ? nextBirthday(b, now).getFullYear() - b.year : null;
}

export function dateLabel(b: Birthday, short = false) {
  return `${short ? MONTHS[b.month - 1].slice(0, 3) : MONTHS[b.month - 1]} ${b.day}`;
}

export function reminderLabel(days: number) {
  return days === 0 ? 'On the day' : `${days} day${days === 1 ? '' : 's'} before`;
}

export function sampleBirthdays(now: Date): Birthday[] {
  return [
    ['Sofia Bennett', 3, 27, 'Friends', 'peach', true, 'Loves peonies, pottery, and a really good pistachio cake.'],
    ['Oliver Chen', 8, 30, 'Friends', 'sage', false, 'A new book and a coffee catch-up.'],
    ['Mum', 14, 56, 'Family', 'lavender', true, 'Make time for a long birthday call.'],
    ['Amelia Brooks', 22, 25, 'Work', 'butter', false, 'Bring something sweet to the office.'],
    ['Leo Martinez', 36, 29, 'Friends', 'sky', false, 'Plan a hike together.'],
    ['Isla Bennett', 49, 23, 'Family', 'rose', false, 'A handwritten card would make her day.'],
  ].map((item, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + Number(item[1]));
    return { id: `sample-${i}`, name: String(item[0]), month: date.getMonth() + 1, day: date.getDate(), year: date.getFullYear() - Number(item[2]), relationship: item[3] as Birthday['relationship'], color: String(item[4]), favorite: Boolean(item[5]), notes: String(item[6]), reminderDays: 1 };
  });
}

function escapeICS(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function icsDate(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

// RFC 5545 limits physical lines to 75 octets. Fold safely between Unicode characters.
function foldLine(line: string) {
  const encoder = new TextEncoder();
  let result = '', size = 0;
  for (const char of line) {
    const length = encoder.encode(char).length;
    if (size + length > 74) { result += '\r\n '; size = 1; }
    result += char;
    size += length;
  }
  return result;
}

export function downloadCalendar(birthdays: Birthday[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Confetti//Birthday Reminder//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Confetti Birthdays'];
  for (const birthday of birthdays) {
    const start = nextBirthday(birthday);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const rule = birthday.month === 2 && birthday.day === 29 ? 'FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1' : `FREQ=YEARLY;BYMONTH=${birthday.month};BYMONTHDAY=${birthday.day}`;
    lines.push('BEGIN:VEVENT', `UID:${birthday.id}@confetti.birthdays`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${icsDate(start)}`, `DTEND;VALUE=DATE:${icsDate(end)}`, `RRULE:${rule}`, `SUMMARY:${escapeICS(`${birthday.name}’s birthday`)}`, `DESCRIPTION:${escapeICS(`${birthday.notes ? birthday.notes + '\n\n' : ''}Remembered with Confetti.`)}`, 'TRANSP:TRANSPARENT', 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeICS(`A little reminder: ${birthday.name}’s birthday!`)}`, `TRIGGER:${birthday.reminderDays === 0 ? 'PT9H' : `-PT${birthday.reminderDays * 24 - 9}H`}`, 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const url = URL.createObjectURL(new Blob([lines.map(foldLine).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = birthdays.length === 1 ? `${birthdays[0].name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-birthday.ics` : 'confetti-birthdays.ics';
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch { throw new Error('The connection was interrupted. Check your internet connection and try again.'); }
  const data = await response.json().catch(() => { throw new Error('Your circle is taking a moment. Please try again.'); });
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
