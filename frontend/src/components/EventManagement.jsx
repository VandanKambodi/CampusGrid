import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import Loader from './Loader';
import ConfirmModal from './ConfirmModal';
import CampusCalendar from './calendar/CampusCalendar';
import EventDetailsModal from './calendar/EventDetailsModal';
import EventForm from './calendar/EventForm';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`));

function EventManagement() {
  const [month, setMonth] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formEvent, setFormEvent] = useState(null);
  const [formDate, setFormDate] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${apiUrl}/api/events?month=${month.getMonth() + 1}&year=${month.getFullYear()}`, { headers: { Authorization: `Bearer ${token}` } });
      setEvents(data);
    } catch { setFormError('Unable to load campus events.'); } finally { setLoading(false); }
  }, [month]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openCreate = (date = '') => { setFormEvent(null); setFormDate(date); setFormOpen(true); setFormError(''); };
  const saveEvent = async (payload) => {
    setSubmitting(true); setFormError('');
    try {
      const token = localStorage.getItem('token');
      const url = formEvent ? `${apiUrl}/api/events/${formEvent._id}` : `${apiUrl}/api/events`;
      await axios({ method: formEvent ? 'put' : 'post', url, data: payload, headers: { Authorization: `Bearer ${token}` } });
      setFormEvent(null); setFormDate(''); setFormOpen(false); await fetchEvents();
    } catch (error) { setFormError(error.response?.data?.message || `Failed to ${formEvent ? 'update' : 'create'} event.`); } finally { setSubmitting(false); }
  };
  const deleteEvent = async () => {
    if (!deleteTarget) return;
    try { await axios.delete(`${apiUrl}/api/events/${deleteTarget._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setDeleteTarget(null); await fetchEvents(); } catch (error) { setFormError(error.response?.data?.message || 'Failed to delete event.'); }
  };
  const shiftMonth = (amount) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  return <section id="events" className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white"><CalendarDays className="h-6 w-6 text-indigo-500" /> Campus Events</h2><p className="mt-1 text-xs text-gray-500">Publish and maintain the shared student calendar.</p></div><button onClick={() => openCreate()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add event</button></div>{formError && !formEvent && !formDate && !formOpen && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{formError}</div>}<CampusCalendar month={month} events={events} isAdmin onMonthChange={shiftMonth} onToday={() => setMonth(new Date())} onSelectDate={(date) => openCreate(date)} onAddEvent={openCreate} />{loading ? <Loader text="Loading events..." /> : <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#111112]"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 dark:border-white/10"><tr><th className="p-4">Event</th><th>Date</th><th>Type</th><th>Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-white/5">{events.map(event => <tr key={event._id}><td className="p-4 font-bold text-gray-900 dark:text-white">{event.title}</td><td>{formatDate(event.date)}</td><td>{event.eventType}</td><td><span className={`font-bold ${event.status === 'Cancelled' ? 'text-red-500' : event.status === 'Published' ? 'text-emerald-500' : 'text-amber-500'}`}>{event.status}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => setViewEvent(event)} aria-label="View event" className="rounded-lg bg-gray-100 p-2 text-gray-600 dark:bg-white/5 dark:text-gray-300"><Eye className="h-4 w-4" /></button><button onClick={() => { setFormEvent(event); setFormDate(''); setFormOpen(true); setFormError(''); }} aria-label="Edit event" className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Edit3 className="h-4 w-4" /></button><button onClick={() => setDeleteTarget(event)} aria-label="Delete event" className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-500/10 dark:text-red-300"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{events.length === 0 && <p className="p-8 text-center text-xs text-gray-500">No events scheduled this month.</p>}</div>}{(formEvent || formOpen) && <EventForm key={`${formEvent?._id || 'new'}-${formDate}`} event={formEvent} defaultDate={formDate} onSubmit={saveEvent} onClose={() => { setFormEvent(null); setFormDate(''); setFormOpen(false); }} submitting={submitting} error={formError} />}<EventDetailsModal event={viewEvent} onClose={() => setViewEvent(null)} /><ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteEvent} title="Delete Event?" message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"?` : 'Are you sure you want to delete this event?'} confirmText="Delete Event" /></section>;
}

export default EventManagement;
