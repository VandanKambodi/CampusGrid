import { CalendarPlus, ExternalLink, MapPin, X } from 'lucide-react';

const formatDate = (date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(`${date}T00:00:00`));
const formatTime = (time) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2000-01-01T${time}`));

function downloadCalendarFile(event) {
  const toIcsDate = (date, time) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
  const escapeText = (value = '') => value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
  const content = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CampusGrid//Campus Events//EN', 'BEGIN:VEVENT',
    `UID:${event._id}@campusgrid`, `DTSTAMP:${toIcsDate(event.date, event.startTime)}Z`,
    `DTSTART:${toIcsDate(event.date, event.startTime)}`, `DTEND:${toIcsDate(event.date, event.endTime)}`,
    `SUMMARY:${escapeText(event.title)}`, `LOCATION:${escapeText(event.location)}`, `DESCRIPTION:${escapeText(event.description)}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, '_')}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function EventDetailsModal({ event, onClose }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151516]" onClick={(clickEvent) => clickEvent.stopPropagation()}>
        {event.image && <img src={event.image} alt="" className="h-44 w-full object-cover" />}
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4"><div><span className={`text-[10px] font-black uppercase tracking-wider ${event.status === 'Cancelled' ? 'text-red-500' : 'text-indigo-500'}`}>{event.status === 'Cancelled' ? 'Cancelled' : event.eventType}</span><h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{event.title}</h2></div><button onClick={onClose} aria-label="Close event details" className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button></div>
          <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300"><p><strong className="text-gray-900 dark:text-white">Date:</strong> {formatDate(event.date)}</p><p><strong className="text-gray-900 dark:text-white">Time:</strong> {formatTime(event.startTime)} - {formatTime(event.endTime)}</p>{event.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-500" />{event.location}</p>}{event.organizer && <p><strong className="text-gray-900 dark:text-white">Organizer:</strong> {event.organizer}</p>}</div>
          {event.description && <p className="whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">{event.description}</p>}
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-white/10"><button onClick={() => downloadCalendarFile(event)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"><CalendarPlus className="w-4 h-4" /> Add to calendar</button>{event.registrationRequired && event.registrationUrl && <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-700">Register <ExternalLink className="w-4 h-4" /></a>}</div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsModal;
