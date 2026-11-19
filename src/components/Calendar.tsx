import { ChevronLeft, ChevronRight } from 'lucide-react';
import { birthdayInYear, MONTHS, sameDay } from '../lib';
import type { Birthday } from '../types';

export function Calendar({ month, onMonthChange, people, today, onSelect, selected, full = false }: {
  month: Date; onMonthChange: (date: Date) => void; people: Birthday[]; today: Date;
  onSelect: (date: Date) => void; selected: Date | null; full?: boolean;
}) {
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const weeks = Math.ceil((offset + totalDays) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, index) => new Date(year, monthIndex, index - offset + 1));

  return <section className={`calendar-card ${full ? 'calendar-full' : 'calendar-mini'}`} aria-label="Birthday calendar">
    <div className="calendar-heading"><h3>{MONTHS[monthIndex]} <span>{year}</span></h3><div className="calendar-controls"><button className="icon-button" onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))} aria-label="Previous month"><ChevronLeft size={17}/></button><button className="icon-button" onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))} aria-label="Next month"><ChevronRight size={17}/></button></div></div>
    <div className="calendar-week" aria-hidden="true">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d}>{full ? d : d[0]}</span>)}</div>
    <div className="calendar-grid">{days.map(day => {
      const birthdays = people.filter(b => sameDay(birthdayInYear(b, day.getFullYear()), day));
      const outside = day.getMonth() !== monthIndex;
      const isToday = sameDay(day, today);
      return <button type="button" key={day.toISOString()} className={`calendar-day ${outside ? 'outside' : ''} ${isToday ? 'is-today' : ''} ${selected && sameDay(day, selected) ? 'is-selected' : ''} ${birthdays.length ? 'has-birthday' : ''}`} onClick={() => onSelect(day)} aria-label={`${day.toLocaleDateString(undefined, {month: 'long', day: 'numeric', year:'numeric'})}${isToday ? ', today' : ''}${birthdays.length ? `, ${birthdays.map(b => b.name).join(' and ')}’s birthday` : ', no birthdays'}`} aria-pressed={!!selected && sameDay(day, selected)}>
        <span className="day-number">{day.getDate()}</span>
        {full ? <span className="day-names">{birthdays.slice(0, 2).map(b => <span className={`day-name ${b.color}`} key={b.id}>{b.name}</span>)}{birthdays.length > 2 && <span className="more-birthdays">+{birthdays.length - 2} more</span>}</span> : birthdays.length > 0 && <span className="calendar-dot"/>}
      </button>;
    })}</div>
    <div className="calendar-legend"><span><i/> A day to celebrate</span>{(year !== today.getFullYear() || monthIndex !== today.getMonth()) && <button className="text-button" onClick={() => onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>}</div>
  </section>;
}
