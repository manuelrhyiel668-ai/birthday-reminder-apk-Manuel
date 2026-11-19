import { ArrowUpRight, Heart, Search, Sparkles } from 'lucide-react';
import type { Birthday } from '../types';
import { dateLabel, daysUntil, initials, turningAge } from '../lib';

export function BirthdayList({ people, today, onOpen, onFavorite, favoriteBusy, demo = false }: {
  people: Birthday[]; today: Date; onOpen: (b: Birthday) => void;
  onFavorite: (b: Birthday) => void; favoriteBusy: string | null; demo?: boolean;
}) {
  return <ul className="birthday-list">{people.map((person, index) => {
    const days = daysUntil(person, today), age = turningAge(person, today);
    return <li className="birthday-row" key={person.id} style={{ animationDelay: `${index * 45}ms` }}>
      <button className="person-cell" onClick={() => onOpen(person)}>
        <span className={`avatar ${person.color}`}>{initials(person.name)}</span>
        <span className="person-name"><strong>{person.name}</strong><span>{age !== null ? `Turning ${age}` : 'A day worth remembering'}</span></span>
      </button>
      <span className={`relationship-tag rel-${person.relationship.toLowerCase()}`}>{person.relationship}</span>
      <span className="birthday-date">{dateLabel(person, true)}<span>{nextYearLabel(person, today)}</span></span>
      <span className={`countdown-pill ${days === 0 ? 'is-birthday' : days <= 7 ? 'soon' : ''}`}>{days === 0 ? <><Sparkles size={12}/>Today!</> : days === 1 ? 'Tomorrow' : `In ${days} days`}</span>
      <button className={`icon-button favorite-button ${person.favorite ? 'is-favorite' : ''}`} onClick={() => demo ? onOpen(person) : onFavorite(person)} disabled={favoriteBusy === person.id} aria-label={demo ? `View sample birthday for ${person.name}` : `${person.favorite ? 'Remove' : 'Add'} ${person.name} ${person.favorite ? 'from' : 'to'} favorites`} aria-pressed={demo ? undefined : person.favorite}><Heart size={17} fill={person.favorite ? 'currentColor' : 'none'}/></button>
      <button className="icon-button row-open" onClick={() => onOpen(person)} aria-label={`View ${person.name}’s birthday`}><ArrowUpRight size={17}/></button>
    </li>;
  })}</ul>;
}

function nextYearLabel(person: Birthday, today: Date) {
  return daysUntil(person, today) === 0 ? 'Happy birthday' : 'Every year';
}

export function EmptyList({ search = false, onAdd }: { search?: boolean; onAdd: () => void }) {
  return <div className="empty-state"><span className="empty-icon">{search ? <Search size={26} strokeWidth={1.4}/> : <Heart size={28} strokeWidth={1.4}/>}</span><h3>{search ? 'No birthdays in this little corner.' : 'A little circle, a lot of love.'}</h3><p>{search ? 'Try another name or change your filters.' : 'Add someone special and start making room for happy days.'}</p>{!search && <button className="button button-primary" onClick={onAdd}>Add your first birthday</button>}</div>;
}
