import { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays } from 'lucide-react';
import Loader from '../components/Loader';
import CampusCalendar from '../components/calendar/CampusCalendar';
import EventDetailsModal from '../components/calendar/EventDetailsModal';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(`${date}T00:00:00`));
const formatTime = (time) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2000-01-01T${time}`));

function Calendar() {
  const [month, setMonth] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${apiUrl}/api/events?month=${month.getMonth() + 1}&year=${month.getFullYear()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { setEvents(data); setError(''); })
      .catch(() => setError('Unable to load campus events.'))
      .finally(() => setLoading(false));
  }, [month]);

  const selectedEvents = events.filter(event => event.date === selectedDate);
  const shiftMonth = (amount) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const showDate = (date) => { setSelectedDate(date); setSelectedEvent(null); };

  return (
    <div className="mx-auto max-w-6xl space-y-6"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-500">CampusGrid</p><h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-black text-gray-900 dark:text-white"><CalendarDays className="h-7 w-7 text-indigo-500" /> Campus Calendar</h1><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Stay close to every workshop, club, lecture, and campus milestone.</p></div></div>{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}{loading ? <Loader text="Loading campus events..." /> : <CampusCalendar month={month} events={events} onMonthChange={shiftMonth} onToday={() => setMonth(new Date())} onSelectDate={showDate} />}
      {selectedDate && <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111112]"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-gray-900 dark:text-white">{formatDate(selectedDate)}</h2><button onClick={() => setSelectedDate(null)} className="text-xs font-bold text-indigo-500">Close</button></div>{selectedEvents.length === 0 ? <p className="flex items-center gap-2 py-6 text-sm text-gray-500"><CalendarDays className="h-5 w-5" /> No events scheduled for this day.</p> : <div className="grid gap-3 sm:grid-cols-2">{selectedEvents.map(event => <button key={event._id} onClick={() => setSelectedEvent(event)} className="rounded-xl border border-gray-200 p-4 text-left hover:border-indigo-400 dark:border-white/10 dark:hover:border-indigo-500"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">{event.eventType}</span>{event.status === 'Cancelled' && <span className="text-[10px] font-black uppercase text-red-500">Cancelled</span>}</div><h3 className="mt-2 font-black text-gray-900 dark:text-white">{event.title}</h3><p className="mt-1 text-xs text-gray-500">{formatTime(event.startTime)} - {formatTime(event.endTime)}{event.location ? ` · ${event.location}` : ''}</p></button>)}</div>}</section>}
      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default Calendar;
