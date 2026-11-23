import { ArrowUpRight, CalendarDays, Sparkles } from 'lucide-react';

type DashboardWelcomeProps = {
  greeting: string;
  date: Date;
  upcomingCount: number;
  onAddBirthday: () => void;
};

export function DashboardWelcome({ greeting, date, upcomingCount, onAddBirthday }: DashboardWelcomeProps) {
  return (
    <section className="dashboard-welcome" aria-label="Welcome">
      <div className="dashboard-welcome-copy">
        <span className="dashboard-welcome-label"><Sparkles size={14}/> YOUR LITTLE CORNER OF JOY</span>
        <h2>{greeting.toLowerCase()},<br/><em>let’s celebrate someone.</em></h2>
        <p>Keep the people you love close, one special day at a time.</p>
        <button type="button" className="dashboard-welcome-action" onClick={onAddBirthday}>
          Add someone special <ArrowUpRight size={17}/>
        </button>
      </div>
      <div className="dashboard-welcome-side">
        <span className="dashboard-date-icon"><CalendarDays size={23}/></span>
        <span className="dashboard-date-caption">TODAY IS</span>
        <strong>{date.toLocaleDateString('en-US', { day: 'numeric' })}</strong>
        <span className="dashboard-date-month">{date.toLocaleDateString('en-US', { month: 'long', weekday: 'long' })}</span>
        <span className="dashboard-upcoming"><b>{upcomingCount}</b> birthdays in your circle</span>
      </div>
    </section>
  );
}
