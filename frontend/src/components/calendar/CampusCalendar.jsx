import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';

const pad = (value) => String(value).padStart(2, '0');
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const weekdayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

function CampusCalendar({ month, events, onMonthChange, onSelectDate, onToday, isAdmin = false, onAddEvent }) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - ((firstDay.getDay() + 6) % 7));
  const todayKey = toDateKey(new Date());
  const eventsByDate = events.reduce((groups, event) => {
    (groups[event.date] ||= []).push(event);
    return groups;
  }, {});

  return (
    <section className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Campus Calendar</p>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{monthLabel.format(month)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToday} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10">Today</button>
          {isAdmin && <button onClick={() => onAddEvent?.(todayKey)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add event</button>}
          <button aria-label="Previous month" onClick={() => onMonthChange(-1)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></button>
          <button aria-label="Next month" onClick={() => onMonthChange(1)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: 7 }, (_, index) => {
          const date = new Date(2024, 0, 1 + index);
          return <div key={index} className="text-center text-[10px] sm:text-xs font-black uppercase text-gray-400 py-2">{weekdayLabel.format(date)}</div>;
        })}
        {Array.from({ length: 42 }, (_, index) => {
          const date = new Date(gridStart);
          date.setDate(gridStart.getDate() + index);
          const dateKey = toDateKey(date);
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = date.getMonth() === month.getMonth();
          return (
            <button key={dateKey} onClick={() => onSelectDate(dateKey)} className={`min-h-20 sm:min-h-24 p-1.5 sm:p-2 text-left rounded-xl border transition-colors ${isCurrentMonth ? 'bg-gray-50/80 dark:bg-white/[0.03] border-gray-200 dark:border-white/10' : 'bg-transparent border-transparent opacity-40'} ${dateKey === todayKey ? 'ring-2 ring-indigo-500/60' : ''} hover:border-indigo-400 dark:hover:border-indigo-500`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${dateKey === todayKey ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-200'}`}>{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-300"><CalendarDays className="w-3 h-3 shrink-0" /><span className="truncate">{dayEvents.length > 1 ? `${dayEvents.length} Events` : dayEvents[0].title}</span></div>
                  <div className="flex gap-0.5">{dayEvents.slice(0, 4).map(event => <span key={event._id} className={`w-1.5 h-1.5 rounded-full ${event.status === 'Cancelled' ? 'bg-red-500' : 'bg-cyan-400'}`} />)}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default CampusCalendar;
