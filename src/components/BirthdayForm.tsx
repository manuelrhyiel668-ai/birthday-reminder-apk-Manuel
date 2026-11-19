import { useState, type FormEvent } from 'react';
import { Bell, Check, Heart, LoaderCircle, Plus, Sparkles } from 'lucide-react';
import type { Birthday, BirthdayInput, Relationship } from '../types';
import { COLORS, MONTHS, RELATIONSHIPS, initials } from '../lib';
import { Modal } from './Modal';

export function BirthdayForm({ birthday, onClose, onSave }: {
  birthday?: Birthday; onClose: () => void; onSave: (input: BirthdayInput, id?: string) => Promise<void>;
}) {
  const [name, setName] = useState(birthday?.name ?? '');
  const [month, setMonth] = useState(birthday?.month ?? '');
  const [day, setDay] = useState(birthday?.day ?? '');
  const [year, setYear] = useState<string | number>(birthday?.year ?? '');
  const [relationship, setRelationship] = useState<Relationship>(birthday?.relationship ?? 'Friends');
  const [color, setColor] = useState(birthday?.color ?? 'peach');
  const [favorite, setFavorite] = useState(birthday?.favorite ?? false);
  const [notes, setNotes] = useState(birthday?.notes ?? '');
  const [reminderDays, setReminderDays] = useState(birthday?.reminderDays ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const candidate = new Date(Number(year || 2000), Number(month) - 1, Number(day));
    if (!name.trim()) return setError('Add their name so we know who to celebrate.');
    if (candidate.getMonth() !== Number(month) - 1 || candidate.getDate() !== Number(day)) return setError('That date does not exist. Check the day, month, and birth year.');
    if (year && candidate > new Date()) return setError('Their date of birth cannot be in the future. Leave the year blank if you’re unsure.');
    setBusy(true);
    try {
      await onSave({ name: name.trim(), month: Number(month), day: Number(day), year: year === '' ? null : Number(year), relationship, favorite, notes, reminderDays, color }, birthday?.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The birthday could not be saved. Please try again.');
      setBusy(false);
    }
  }

  return <Modal title={birthday ? 'A little update.' : 'Someone worth celebrating.'} eyebrow={birthday ? 'EDIT BIRTHDAY' : 'GROW YOUR CIRCLE'} onClose={onClose} busy={busy} wide>
    <form onSubmit={submit} className="birthday-form">
      <p className="form-intro">Keep their special day close. We’ll handle the remembering.</p>
      <div className="person-preview">
        <div className={`avatar avatar-large ${color}`}>{name.trim() ? initials(name) : <Plus size={28} strokeWidth={1.5}/>}</div>
        <div className="color-picker" role="radiogroup" aria-label="Avatar color">
          {COLORS.map(c => <label className={`color-option ${c}`} key={c} title={c}><input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} aria-label={`${c} avatar`} />{color === c && <Check size={13}/>}</label>)}
        </div>
      </div>
      <label className="field">Their name <span className="required-note">required</span><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sofia, Dad, your favorite human" required maxLength={80} autoComplete="off" /></label>
      <fieldset className="birthday-fields"><legend>Birthday <span className="required-note">day & month required</span></legend>
        <label className="field"><span>Month</span><select required value={month} onChange={e => setMonth(Number(e.target.value))}><option value="" disabled>Month</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
        <label className="field"><span>Day</span><select required value={day} onChange={e => setDay(Number(e.target.value))}><option value="" disabled>Day</option>{Array.from({length: 31}, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
        <label className="field"><span>Year <span className="subtle">optional</span></span><input type="number" min={1900} max={new Date().getFullYear()} value={year} onChange={e => setYear(e.target.value)} placeholder="YYYY" inputMode="numeric" /></label>
      </fieldset>
      <fieldset className="relationship-picker"><legend>In my circle as</legend><div>{RELATIONSHIPS.map(rel => <label key={rel} className={relationship === rel ? 'selected' : ''}><input type="radio" name="relationship" checked={relationship === rel} onChange={() => setRelationship(rel)} />{rel}</label>)}</div></fieldset>
      <label className="field"><span className="label-with-icon"><Bell size={15}/> Calendar reminder</span><select value={reminderDays} onChange={e => setReminderDays(Number(e.target.value))}><option value={0}>On their birthday</option><option value={1}>1 day before</option><option value={3}>3 days before</option><option value={7}>1 week before</option><option value={14}>2 weeks before</option></select><small>Included when you add this birthday to your calendar.</small></label>
      <label className="field">The little things <span className="subtle">optional</span><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Their favorite cake, a gift idea, a memory to mention…" maxLength={1500} rows={3}/></label>
      <label className="favorite-field"><input type="checkbox" checked={favorite} onChange={e => setFavorite(e.target.checked)}/><Heart size={17} fill={favorite ? 'currentColor' : 'none'}/> Keep them in my favorites</label>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="form-footer"><button type="button" className="button button-quiet" onClick={onClose} disabled={busy}>Cancel</button><button className="button button-primary" disabled={busy} type="submit">{busy ? <LoaderCircle size={17} className="spin"/> : <Sparkles size={17}/>} {busy ? 'Saving birthday…' : birthday ? 'Save changes' : 'Add to my circle'}</button></div>
    </form>
  </Modal>;
}
