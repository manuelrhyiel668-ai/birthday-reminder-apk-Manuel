import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, CalendarDays, CakeSlice,
  Check, CheckCircle2, ChevronRight, CircleHelp, Download, Flower2, Gift,
  Heart, LayoutGrid, LoaderCircle, Plus, Search, Settings2, Share2, ShieldCheck,
  Smartphone, Sparkles, Trash2, Users, X, Pencil,
} from 'lucide-react';
import type { Birthday, BirthdayInput, InstallPrompt, View } from './types';
import {
  birthdayInYear, dateLabel, daysUntil, downloadCalendar, firstName,
  initials, reminderLabel, sameDay, sampleBirthdays, turningAge,
} from './lib';
import { CakeIllustration } from './components/CakeIllustration';
import { Calendar } from './components/Calendar';
import { BirthdayList, EmptyList } from './components/BirthdayList';
import { BirthdayForm } from './components/BirthdayForm';
import { Modal } from './components/Modal';

const STORAGE_KEY = 'confetti-birthdays-v1';

const kindnessIdeas = [
  'Send them a voice message singing a few lines of “Happy Birthday.”',
  'Make a tiny photo collage of your favorite memories together.',
  'Surprise them with their favorite snack or drink.',
  'Write a short note telling them why they matter to you.',
  'Plan a quick call and let them choose the topic.',
  'Share an old funny photo and relive the memory.',
  'Create a playlist with songs that remind you of them.',
  'Give them a small handmade gift. Thoughtfulness beats price.',
];

const navigation: { id: View; label: string; icon: typeof Heart }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'birthdays', label: 'My birthdays', icon: CakeSlice },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'reminders', label: 'Reminders', icon: Bell },
];

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [records, setRecords] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [today, setToday] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('All people');
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState<Birthday | 'new' | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [favoriteBusy, setFavoriteBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [kindnessIdeaIndex, setKindnessIdeaIndex] = useState(() => Math.floor(Math.random() * kindnessIdeas.length));
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone));
  const [installOpen, setInstallOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      setRecords(Array.isArray(parsed) ? parsed as Birthday[] : []);
    } catch {
      setLoadError('Your browser could not read saved birthdays. Check your browser storage settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    function prompt(event: Event) { event.preventDefault(); setInstallPrompt(event as InstallPrompt); }
    function appInstalled() { setInstalled(true); setInstallPrompt(null); setInstallOpen(false); }
    function network() { setOnline(navigator.onLine); }
    function refreshDate() { setToday(new Date()); }
    window.addEventListener('beforeinstallprompt', prompt);
    window.addEventListener('appinstalled', appInstalled);
    window.addEventListener('online', network);
    window.addEventListener('offline', network);
    window.addEventListener('focus', refreshDate);
    const clock = window.setInterval(refreshDate, 60000);
    return () => {
      window.removeEventListener('beforeinstallprompt', prompt);
      window.removeEventListener('appinstalled', appInstalled);
      window.removeEventListener('online', network);
      window.removeEventListener('offline', network);
      window.removeEventListener('focus', refreshDate);
      clearInterval(clock);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    if (!celebrating) return;
    const timeout = setTimeout(() => setCelebrating(false), 2200);
    return () => clearTimeout(timeout);
  }, [celebrating]);

  const demo = !loading && !loadError && records.length === 0;
  const people = useMemo(() => demo ? sampleBirthdays(today) : records, [demo, today, records]);
  const sorted = useMemo(() => [...people].sort((a, b) => daysUntil(a, today) - daysUntil(b, today) || a.name.localeCompare(b.name)), [people, today]);
  const next = sorted[0];
  const selected = people.find(b => b.id === detailId);
  const nextThirty = people.filter(b => daysUntil(b, today) <= 30).length;
  const thisMonth = people.filter(b => b.month === today.getMonth() + 1).length;
  const due = records.filter(b => daysUntil(b, today) <= b.reminderDays).length;
  const filtered = sorted.filter(b => {
    const matchesSearch = `${b.name} ${b.notes}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesFilter = filter === 'all' || (filter === 'month' && daysUntil(b, today) <= 30) || (filter === 'favorites' && b.favorite);
    return matchesSearch && matchesFilter && (category === 'All people' || b.relationship === category);
  });
  const daily = selectedDate ? sorted.filter(b => sameDay(birthdayInYear(b, selectedDate.getFullYear()), selectedDate)) : [];

  function navigate(nextView: View) {
    setView(nextView); setQuery(''); setFilter('all'); setCategory('All people');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openBirthday(b: Birthday) { setDetailId(b.id); setConfirmDelete(false); setDetailError(''); }
  function addBirthday() {
    if (loadError || loading) return setToast({ text: 'Please refresh the page and try again.', error: true });
    setForm('new');
  }
  async function saveBirthday(data: BirthdayInput, id?: string) {
    const birthday: Birthday = { ...data, id: id ?? (crypto.randomUUID?.() ?? String(Date.now())) };
    setRecords(previous => {
      const updated = id ? previous.map(b => b.id === id ? birthday : b) : [...previous, birthday];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setForm(null);
    setToast({ text: id ? 'The little details are up to date.' : `${firstName(data.name)} is in your circle. Let the remembering begin!` });
    if (!id) setCelebrating(true);
  }
  async function favorite(b: Birthday) {
    if (favoriteBusy) return;
    setFavoriteBusy(b.id);
    try {
      setRecords(previous => {
        const updated = previous.map(person => person.id === b.id ? { ...person, favorite: !person.favorite } : person);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) { setToast({ text: error instanceof Error ? error.message : 'Could not update favorites.', error: true }); }
    finally { setFavoriteBusy(null); }
  }
  async function deleteBirthday(b: Birthday) {
    setDeleteBusy(true); setDetailError('');
    try {
      setRecords(previous => {
        const updated = previous.filter(person => person.id !== b.id);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      setDetailId(null); setConfirmDelete(false);
      setToast({ text: `${firstName(b.name)}’s birthday was removed from your circle.` });
    } catch (error) { setDetailError(error instanceof Error ? error.message : 'Could not remove this birthday.'); }
    finally { setDeleteBusy(false); }
  }
  function exportBirthdays(list = records) {
    if (!list.length || list.some(b => b.id.startsWith('sample-'))) {
      setToast({ text: 'Add your first birthday, then take your reminders to your calendar.' });
      return;
    }
    downloadCalendar(list);
    setToast({ text: 'Calendar file ready. Open it in your calendar to enable annual birthday alerts.' });
  }
  async function install() {
    if (installed) { setToast({ text: 'Confetti is already on your home screen. Happy remembering!' }); return; }
    if (!installPrompt) { setInstallOpen(true); return; }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') { setInstalled(true); setInstallOpen(false); setToast({ text: 'A happy little place on your home screen.' }); }
      setInstallPrompt(null);
    } catch { setInstallOpen(true); setInstallPrompt(null); }
  }
  async function share() {
    const url = window.location.origin;
    if (navigator.share) {
      try { await navigator.share({ title: 'Confetti — Birthday Reminder', text: 'Good people. Unforgettable days. A little place to remember your favorite people.', url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); setToast({ text: 'App link copied. Send a little Confetti to someone you love.' }); }
    catch { setShareOpen(true); }
  }

  const title = view === 'overview' ? 'Overview' : view === 'birthdays' ? 'My birthdays' : view === 'calendar' ? 'Calendar' : view === 'reminders' ? 'Reminders' : 'Settings';
  const greeting = today.getHours() < 12 ? 'GOOD MORNING' : today.getHours() < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const ready = !loading && !loadError;

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate('overview')} aria-label="Confetti home"><span className="brand-mark"><Flower2 size={31} strokeWidth={1.6}/></span><span>confetti<span className="brand-period">.</span></span></button>
      <div className="sidebar-intro">A little reminder. A lot of love.</div>
      <p className="nav-eyebrow">YOUR HAPPY LITTLE SPACE</p>
      <nav className="side-nav" aria-label="Main navigation">{navigation.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? 'page' : undefined}><item.icon size={19} strokeWidth={1.7}/><span>{item.label}</span>{item.id === 'birthdays' && ready && <span className="nav-count">{people.length}</span>}{item.id === 'reminders' && due > 0 && <span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="install-card"><div className="install-card-top"><span className="install-icon"><Smartphone size={22} strokeWidth={1.5}/></span><Sparkles size={22} strokeWidth={1.2}/></div><h3>A little closer.</h3><p>Your people’s special days,<br/>right on your home screen.</p><button onClick={() => void install()}>{installed ? 'App installed' : 'Install Confetti'}{installed ? <Check size={15}/> : <ArrowUpRight size={16}/>}</button><span className="install-note">Free. Just a little thoughtful.</span></div>
        <button className={`nav-item settings-nav ${view === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')} aria-current={view === 'settings' ? 'page' : undefined}><Settings2 size={18} strokeWidth={1.7}/><span>Settings & help</span></button>
        <div className="sidebar-footer">Made for your people <Heart size={11}/></div>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><span>Your space</span><ChevronRight size={12}/><strong>{title}</strong></div><button className="mobile-brand" onClick={() => navigate('overview')}><Flower2 size={23}/>confetti.</button><div className="topbar-right"><span className="today-date"><CalendarDays size={15}/>{today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="topbar-divider"/><button className={`icon-button notification-button ${due ? 'has-notifications' : ''}`} aria-label={due ? `${due} upcoming birthday reminders` : 'View birthday reminders'} onClick={() => navigate('reminders')}><Bell size={19} strokeWidth={1.7}/></button><span className="your-circle" title="Your private circle"><Flower2 size={19}/></span></div></header>
      <main id="main-content">
        
        {loadError && <div className="error-banner" role="alert"><CircleHelp size={19}/><span><strong>Let’s reconnect to your circle.</strong>{loadError}</span><button className="button button-small button-outline" onClick={() => void load()}>Retry</button></div>}

        <section className="page-heading"><div><p className="eyebrow">{view === 'overview' ? `${greeting} · GOOD PEOPLE. UNFORGETTABLE DAYS.` : view === 'birthdays' ? 'ALL YOUR FAVORITE HUMANS' : view === 'calendar' ? 'HAPPY DAYS, ON THE HORIZON' : view === 'reminders' ? 'A LITTLE HEADS-UP GOES A LONG WAY' : 'MAKE YOURSELF AT HOME'}</p><h1>{view === 'overview' ? <>Make their <em>day.</em><span className="heading-sparkle"><Sparkles size={32} strokeWidth={1.1}/></span></> : view === 'birthdays' ? <>Your kind of <em>people.</em></> : view === 'calendar' ? <>Something to <em>celebrate.</em></> : view === 'reminders' ? <>A thoughtful <em>nudge.</em></> : <>Your happy little <em>space.</em></>}</h1><p className="page-subtitle">{view === 'overview' ? 'Because remembering is a little way of saying you care.' : view === 'birthdays' ? 'The people you love, and the days that belong to them.' : view === 'calendar' ? 'A whole year of reasons to make someone smile.' : view === 'reminders' ? 'Keep the important days close. Leave a little time for the thoughtful things.' : 'Keep Confetti close, share a little joy, and make it yours.'}</p></div>{view !== 'settings' && <button className="button button-primary add-birthday" onClick={addBirthday} disabled={loading}><Plus size={18} strokeWidth={1.8}/>Add birthday</button>}</section>

        {demo && view !== 'settings' && <div className="sample-banner"><span className="sample-banner-icon"><Sparkles size={16}/></span><p>A little inspiration.<span> You’re exploring sample birthdays. Ready to add your people?</span></p><button onClick={addBirthday}>Start my circle <ArrowRight size={14}/></button></div>}

        {view === 'overview' && <>
          <div className="floating-decorations" aria-hidden="true">
            <span className="float-balloon balloon-peach"/><span className="float-balloon balloon-sage"/>
            <span className="float-balloon balloon-lilac"/><span className="float-balloon balloon-yellow"/>
            <span className="float-balloon balloon-rose"/><span className="float-balloon balloon-blue"/>
            <span className="float-balloon balloon-mini"/><span className="float-balloon balloon-mint"/>
            <span className="float-sparkle sparkle-one">✦</span><span className="float-sparkle sparkle-two">♡</span>
            <span className="float-sparkle sparkle-three">✧</span><span className="float-sparkle sparkle-four">✷</span>
            <span className="confetti-dot dot-one"/><span className="confetti-dot dot-two"/><span className="confetti-dot dot-three"/><span className="confetti-dot dot-four"/>
          </div>
          <div className="circle-stats" aria-label={demo ? 'Sample circle statistics' : 'Your birthday circle statistics'}><div><span className="stat-symbol"><Users size={17}/></span><strong>{loading ? '—' : String(people.length).padStart(2, '0')}</strong><span>in your circle</span></div><span className="stat-divider"/><div><span className="stat-symbol"><Gift size={17}/></span><strong>{loading ? '—' : String(nextThirty).padStart(2, '0')}</strong><span>in the next 30 days</span></div><span className="stat-divider"/><div><span className="stat-symbol"><CalendarDays size={17}/></span><strong>{loading ? '—' : String(thisMonth).padStart(2, '0')}</strong><span>this month</span></div>{demo && <span className="sample-label">SAMPLE CIRCLE</span>}</div>
          <div className="overview-grid">
            <div className="overview-main">
              {loading ? <div className="hero-card skeleton-hero"><span className="skeleton sk-small"/><span className="skeleton sk-title"/><span className="skeleton sk-text"/><span className="skeleton sk-button"/></div> : next ? <section className="hero-card"><div className="hero-copy"><span className="hero-eyebrow"><span className="tiny-sparkle"/> {daysUntil(next, today) === 0 ? 'TODAY’S THE DAY' : 'NEXT UP IN YOUR CIRCLE'}</span><h2>{firstName(next.name)}’s<br/>big day<span className="hero-period">.</span></h2><p className="hero-birthday">{turningAge(next, today) !== null && <>Turning {turningAge(next, today)} <span>·</span> </>}{dateLabel(next)}</p><span className="hero-countdown"><span className="countdown-dot"/>{daysUntil(next, today) === 0 ? 'Time to make a wish' : daysUntil(next, today) === 1 ? 'Just one sleep to go' : `${daysUntil(next, today)} days to sprinkle a little joy`}</span><button className="button hero-button" onClick={() => openBirthday(next)}>{daysUntil(next, today) === 0 ? 'Make a birthday wish' : 'Plan a little something'}<ArrowUpRight size={16}/></button></div><div className="hero-art"><span className="handwritten">a reason to celebrate</span><CakeIllustration/><span className="hero-art-label">make a wish & pass the cake</span></div></section> : <section className="hero-card hero-empty"><CakeIllustration/><EmptyList onAdd={addBirthday}/></section>}

              <section className="upcoming-section"><div className="section-heading"><div className="section-title"><h2>Coming up</h2><span className="section-count">{loading ? '—' : people.length}</span></div><button className="text-button" onClick={() => navigate('birthdays')}>View all birthdays <ArrowRight size={14}/></button></div>
                <div className="list-toolbar"><div className="filter-tabs" aria-label="Filter birthdays">{[['all', 'All upcoming'], ['month', 'Next 30 days'], ['favorites', 'Favorites']].map(([value, label]) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)} aria-pressed={filter === value}>{value === 'favorites' && <Heart size={12}/>} {label}</button>)}</div><button className="search-toggle icon-button" aria-label="Search all birthdays" onClick={() => navigate('birthdays')}><Search size={17}/></button></div>
                {loading ? <ListSkeleton/> : loadError ? <div className="list-error"><Flower2 size={25}/><p>Your people are worth a second try.</p><button className="text-button" onClick={() => void load()}>Reconnect <ArrowRight size={14}/></button></div> : filtered.length ? <BirthdayList people={filtered.slice(0, 4)} today={today} onOpen={openBirthday} onFavorite={b => void favorite(b)} favoriteBusy={favoriteBusy} demo={demo}/> : <EmptyList search={filter !== 'all'} onAdd={addBirthday}/>}
                {filtered.length > 4 && <button className="list-footer-button" onClick={() => navigate('birthdays')}>A few more days to look forward to <ArrowRight size={14}/></button>}
              </section>
            </div>
            <aside className="overview-aside"><Calendar month={calendarMonth} onMonthChange={setCalendarMonth} people={people} today={today} selected={selectedDate} onSelect={date => { setSelectedDate(date); setView('calendar'); }}/><div className="thought-card"><span className="thought-icon"><Heart size={20} strokeWidth={1.35}/></span><p>It’s not just a date.<br/>It’s <em>their</em> day.</p><span className="kindness-idea" aria-live="polite">{kindnessIdeas[kindnessIdeaIndex]}</span><button className="text-button kindness-button" onClick={() => setKindnessIdeaIndex(index => (index + 1 + Math.floor(Math.random() * (kindnessIdeas.length - 1))) % kindnessIdeas.length)}><Sparkles size={14}/> Surprise me <ArrowRight size={13}/></button><svg viewBox="0 0 82 38" fill="none" aria-hidden="true"><path d="M5 29c16-13 30 6 43-5 8-8-2-22-11-15-11 11 6 26 19 19l20-14m-12 0h12l-3 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div></aside>
          </div>
          <div className="page-footnote"><ShieldCheck size={13}/><span>Your circle is personal. Saved for this browser, just for you.</span><button onClick={() => navigate('settings')}>How it works <ArrowUpRight size={12}/></button></div>
        </>}

        {view === 'birthdays' && <section className="content-card all-birthdays"><div className="section-heading"><div className="section-title"><h2>Your circle</h2><span className="section-count">{people.length}</span></div><button className="text-button export-button" onClick={() => exportBirthdays()}><Download size={15}/>Export calendar</button></div><div className="all-list-toolbar"><label className="search-field"><Search size={17}/><input aria-label="Search birthdays by name or notes" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find someone in your circle…"/>{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}</label><select className="category-filter" value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by relationship">{['All people', 'Friends', 'Family', 'Work', 'Other'].map(value => <option key={value}>{value}</option>)}</select></div><div className="filter-tabs standalone-tabs">{[['all', 'All birthdays'], ['month', 'Next 30 days'], ['favorites', 'Favorites']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'selected' : ''} aria-pressed={filter === value}>{label}</button>)}</div><div className="list-column-labels"><span>THE PERSON</span><span>YOUR CIRCLE</span><span>BIRTHDAY</span><span>THE COUNTDOWN</span></div>{loading ? <ListSkeleton/> : loadError ? <div className="empty-state"><WifiOff size={26}/><h3>Your circle is taking a moment.</h3><p>Use Retry above to reconnect.</p></div> : filtered.length ? <BirthdayList people={filtered} today={today} onOpen={openBirthday} onFavorite={b => void favorite(b)} favoriteBusy={favoriteBusy} demo={demo}/> : <EmptyList search={!!query || filter !== 'all' || category !== 'All people'} onAdd={addBirthday}/>}</section>}

        {view === 'calendar' && <div className="calendar-view"><Calendar month={calendarMonth} onMonthChange={month => {setCalendarMonth(month); setSelectedDate(null);}} people={people} today={today} selected={selectedDate} full onSelect={date => {setSelectedDate(date); if (date.getMonth() !== calendarMonth.getMonth()) setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));}}/><section className="content-card calendar-day-panel"><div className="section-heading"><div className="section-title"><h2>{selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Pick a little square'}</h2>{selectedDate && <span className="section-count">{daily.length}</span>}</div><Flower2 size={20} className="muted-flower"/></div>{selectedDate ? daily.length ? <BirthdayList people={daily} today={today} onOpen={openBirthday} onFavorite={b => void favorite(b)} favoriteBusy={favoriteBusy} demo={demo}/> : <div className="calendar-empty"><span className="empty-icon"><CakeSlice size={26}/></span><h3>A little room for a happy day.</h3><p>No birthdays on this date yet.<br/>Someone special missing from your circle?</p><button className="text-button" onClick={addBirthday}>Add a birthday <Plus size={14}/></button></div> : <div className="calendar-empty"><CalendarDays size={32} strokeWidth={1.1}/><h3>Every day has a little possibility.</h3><p>Choose a date to see who’s celebrating.</p></div>}</section><p className="calendar-note"><CircleHelp size={14}/>February 29 birthdays appear on the last day of February each year.</p></div>}

        {view === 'reminders' && <div className="reminders-view"><section className="reminders-callout"><span className="reminders-symbol"><Bell size={30} strokeWidth={1.3}/></span><div><p className="eyebrow">GOOD TIMING IS A LOVE LANGUAGE</p><h2>A reminder that travels with you.</h2><p>Add your birthdays to Apple Calendar, Google Calendar, or Outlook. Annual events include your chosen alert time, even when Confetti is closed.</p><button className="button button-primary" onClick={() => exportBirthdays()}><ArrowDownToLine size={17}/>Take reminders to my calendar</button><small>Open the downloaded .ics file or import it in your calendar. Allow calendar notifications to receive alerts.</small></div></section><section className="content-card reminder-list"><div className="section-heading"><div className="section-title"><h2>Little nudges, all lined up</h2><span className="section-count">{people.length}</span></div><span className="muted-label">{demo ? 'Sample reminders' : 'Calendar alerts'}</span></div>{loading ? <ListSkeleton/> : loadError ? <div className="empty-state"><WifiOff size={24}/><h3>Reconnect to see your reminders.</h3></div> : sorted.map(b => <div className="reminder-row" key={b.id}><span className={`avatar ${b.color}`}><Bell size={19} strokeWidth={1.5}/></span><div><button className="name-link" onClick={() => openBirthday(b)}>{b.name}’s birthday</button><span>{dateLabel(b)} <i>·</i> {reminderLabel(b.reminderDays)}</span></div><button className="button button-small button-outline" onClick={() => exportBirthdays([b])}><CalendarDays size={14}/><span>Add to calendar</span></button></div>)}<div className="reminder-disclaimer"><CircleHelp size={15}/><p>Confetti shows upcoming birthdays here. Alerts are delivered by your calendar after you import them. If you edit a birthday, update its calendar event too.</p></div></section></div>}

        {view === 'settings' && <div className="settings-grid"><section className="content-card settings-card"><span className="settings-card-icon"><Smartphone size={25} strokeWidth={1.5}/></span><h2>A home for happy days.</h2><p>Install Confetti on your phone or computer. It opens in its own window, with your circle one tap away.</p><button className="button button-primary" onClick={() => void install()}>{installed ? <CheckCircle2 size={17}/> : <Download size={17}/>} {installed ? 'Already installed' : 'Install Confetti'}</button><button className="text-button" onClick={() => setInstallOpen(true)}>Installation help <ArrowUpRight size={14}/></button></section><section className="content-card settings-card"><span className="settings-card-icon sage"><Share2 size={25} strokeWidth={1.5}/></span><h2>A good thing to pass on.</h2><p>A little more remembering, a little more love. Share the app with friends so they can make their own circle.</p><button className="button button-outline" onClick={() => void share()}><Share2 size={16}/>Share Confetti</button><small>Sharing the app does not share your birthdays.</small></section><section className="content-card privacy-card"><span className="settings-card-icon lavender"><ShieldCheck size={25} strokeWidth={1.5}/></span><div><h2>Your people stay your people.</h2><p>Your birthdays are saved securely online and linked to this browser with a private cookie. Other visitors get their own separate circle. No account is needed.</p><p>Use the same browser to return to your circle. Clearing site data, switching browsers, or using another device starts a new circle. Export your birthdays to your calendar to keep a personal copy.</p><p>Confetti needs an internet connection to load and save your birthdays. Once imported, calendar reminders follow your calendar’s settings.</p><button className="text-button" onClick={() => exportBirthdays()}>Export my birthday calendar <Download size={15}/></button></div></section><div className="settings-signoff"><Flower2 size={30} strokeWidth={1.2}/><span>Less forgetting.<br/><em>More celebrating.</em></span><small>Confetti · Birthday Reminder</small></div></div>}
      </main>
    </div>

    <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => navigate(item.id)} aria-current={view === item.id ? 'page' : undefined}><item.icon size={21} strokeWidth={1.6}/><span>{item.id === 'birthdays' ? 'Birthdays' : item.label}</span></button>)}<button className={view === 'settings' ? 'active' : ''} onClick={() => navigate('settings')} aria-current={view === 'settings' ? 'page' : undefined}><Settings2 size={21} strokeWidth={1.6}/><span>Settings</span></button></nav>

    {form && <BirthdayForm birthday={form === 'new' ? undefined : form} onClose={() => setForm(null)} onSave={saveBirthday}/>}

    {selected && !form && <Modal title={`${firstName(selected.name)}’s special day.`} eyebrow={demo ? 'A LITTLE INSPIRATION · SAMPLE BIRTHDAY' : 'A GOOD DAY FOR A LITTLE LOVE'} onClose={() => setDetailId(null)} busy={deleteBusy}>
      <div className="birthday-detail"><div className="detail-person"><span className={`avatar avatar-large ${selected.color}`}>{initials(selected.name)}</span><div><h3>{selected.name}</h3><span className={`relationship-tag rel-${selected.relationship.toLowerCase()}`}>{selected.relationship}</span></div>{!demo && <button className={`icon-button favorite-button ${selected.favorite ? 'is-favorite' : ''}`} onClick={() => void favorite(selected)} disabled={favoriteBusy === selected.id} aria-pressed={selected.favorite} aria-label={selected.favorite ? 'Remove from favorites' : 'Add to favorites'}><Heart size={20} fill={selected.favorite ? 'currentColor' : 'none'}/></button>}</div><div className="detail-date"><CalendarDays size={23} strokeWidth={1.4}/><div><strong>{dateLabel(selected)}{selected.year ? `, ${selected.year}` : ''}</strong><span>{turningAge(selected, today) !== null ? `Turning ${turningAge(selected, today)}` : 'A day to celebrate'} {daysUntil(selected, today) === 0 ? 'today!' : daysUntil(selected, today) === 1 ? 'tomorrow' : `in ${daysUntil(selected, today)} days`}</span></div><Sparkles size={23} strokeWidth={1.3}/></div><div className="detail-notes"><p className="eyebrow"><Gift size={13}/> THE LITTLE THINGS</p><p>{selected.notes || 'A favorite cake? The perfect gift? Add a little note so you remember the things that make them smile.'}</p></div><div className="detail-reminder"><Bell size={17}/><span>Calendar reminder: <strong>{reminderLabel(selected.reminderDays).toLowerCase()}</strong></span></div>{demo ? <><p className="detail-sample-note">This birthday is an example. Add your own people to start a personal circle.</p><button className="button button-primary button-full" onClick={() => {setDetailId(null); addBirthday();}}><Plus size={17}/>Add someone to my circle</button></> : <><button className="button button-primary button-full" onClick={() => exportBirthdays([selected])}><CalendarDays size={17}/>Add to my calendar <ArrowUpRight size={16}/></button><p className="detail-calendar-help">Import the calendar file to get a reminder every year.</p><div className="detail-actions"><button className="text-button" onClick={() => {setDetailId(null); setForm(selected);}}><Pencil size={14}/>Edit birthday</button><button className="text-button delete-text" onClick={() => setConfirmDelete(true)}><Trash2 size={14}/>Remove</button></div>{confirmDelete && <div className="delete-confirm" role="alert"><strong>Remove {firstName(selected.name)} from your circle?</strong><p>This removes the saved birthday. Calendar events you’ve imported stay in your calendar.</p><div><button className="button button-small button-quiet" disabled={deleteBusy} onClick={() => setConfirmDelete(false)}>Keep birthday</button><button className="button button-small button-danger" disabled={deleteBusy} onClick={() => void deleteBirthday(selected)}>{deleteBusy ? <LoaderCircle size={14} className="spin"/> : <Trash2 size={14}/>}Remove birthday</button></div></div>}{detailError && <p className="inline-error" role="alert">{detailError}</p>}</>}
      </div>
    </Modal>}

    {installOpen && <Modal title="A happy place on your home screen." eyebrow="TAKE A LITTLE CONFETTI WITH YOU" onClose={() => setInstallOpen(false)}><div className="install-dialog"><span className="app-icon-preview"><Flower2 size={43} strokeWidth={1.5}/></span><p>Install Confetti for quick access to your people’s special days. Share the link so others can install it too.</p>{installPrompt && <button className="button button-primary button-full" onClick={() => void install()}><Download size={17}/>Install Confetti</button>}<div className="install-platform"><strong><Smartphone size={18}/>Android</strong><p>Open this site in Chrome. Tap the browser menu, then <b>Install app</b> or <b>Add to Home screen</b>.</p></div><div className="install-platform"><strong><Share2 size={18}/>iPhone & iPad</strong><p>Open this site in Safari. Tap <b>Share</b>, then <b>Add to Home Screen</b>. Turn on <b>Open as Web App</b> if shown.</p></div><div className="install-platform"><strong><LayoutGrid size={18}/>On your computer</strong><p>In Chrome or Edge, select the install icon in the address bar, or use the browser menu to install this page as an app.</p></div><p className="install-browser-note">Install options appear in a supported browser over a secure connection. This is an installable web app, so no APK is needed.</p><button className="text-button" onClick={() => void share()}>Share the app <Share2 size={14}/></button></div></Modal>}
    {shareOpen && <Modal title="Pass on a little Confetti." eyebrow="GOOD THINGS ARE BETTER SHARED" onClose={() => setShareOpen(false)}><div className="share-dialog"><p>Copy this link and send it to someone you love. They can install Confetti and start their own birthday circle.</p><label className="field">App link<input readOnly value={window.location.origin} onFocus={e => e.target.select()}/></label><p className="subtle">Your personal birthdays are never included in the link.</p></div></Modal>}
    {toast && <div className={`toast ${toast.error ? 'toast-error' : ''}`} role={toast.error ? 'alert' : 'status'}>{toast.error ? <CircleHelp size={19}/> : <CheckCircle2 size={19}/>}<span>{toast.text}</span><button onClick={() => setToast(null)} aria-label="Dismiss message"><X size={16}/></button></div>}
    {celebrating && <div className="confetti-burst" aria-hidden="true">{Array.from({length: 22}, (_, i) => <i key={i} style={{ '--i': i, '--x': `${(i * 47 + 13) % 100}vw`, '--r': `${i * 37}deg`, background: ['#c7775d','#b8bc92','#d8c5d9','#e6c783'][i % 4] } as CSSProperties}/>)}</div>}
  </div>;
}

function ListSkeleton() {
  return <div className="list-skeleton" role="status" aria-label="Loading your birthdays">{[0,1,2,3].map(i => <div className="skeleton-row" key={i}><span className="skeleton sk-avatar"/><span><i className="skeleton sk-name"/><i className="skeleton sk-meta"/></span><i className="skeleton sk-tag"/><i className="skeleton sk-date"/></div>)}<span className="sr-only">Loading your circle…</span></div>;
}
