
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, X, Clock, PlusCircle, Bed
} from 'lucide-react';
import { Apartment, Booking } from '../types';

interface CalendarProps {
  apartments: Apartment[];
  bookings: Booking[];
  onBookingInitiate: (aptId: string, start: string, end: string) => void;
  onEditBooking: (id: string) => void;
  state?: any; 
}

const BookingCalendar: React.FC<CalendarProps> = ({ apartments, bookings, onBookingInitiate, onEditBooking, state }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selection, setSelection] = useState<{ aptId: string; start: string | null; end: string | null }>({ aptId: '', start: null, end: null });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);
  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const getBookingForDay = (aptId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.find(b => b.apartmentId === aptId && b.status !== 'cancelled' && dateStr >= b.startDate && dateStr <= b.endDate);
  };

  const handleSlotClick = (aptId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existing = getBookingForDay(aptId, day);
    if (existing) { onEditBooking(existing.id); return; }
    if (dateStr < todayStr) return;
    if (selection.aptId !== aptId || !selection.start || (selection.start && selection.end)) setSelection({ aptId, start: dateStr, end: null });
    else setSelection({ ...selection, end: dateStr < selection.start ? selection.start : dateStr, start: dateStr < selection.start ? dateStr : selection.start });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-bold">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-950 rounded-2xl text-white"><CalIcon className="w-6 h-6" /></div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">{monthName}</h2>
        </div>
        <div className="flex items-center gap-4">
          {selection.start && (
            <div className="flex items-center gap-3">
              <div className="px-5 py-2.5 bg-sky-50 border border-sky-100 rounded-xl text-[10px] font-black text-sky-700 uppercase">{selection.start} {selection.end ? `→ ${selection.end}` : '...'}</div>
              {selection.end && <button onClick={() => onBookingInitiate(selection.aptId, selection.start!, selection.end!)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all">Finalize</button>}
              <button onClick={() => setSelection({ aptId: '', start: null, end: null })} className="p-3 text-rose-500"><X className="w-5 h-5" /></button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-white rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-5 py-2 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Today</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-white rounded-xl"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="sticky left-0 z-40 bg-slate-950 p-6 min-w-[140px] border-r border-white/10 text-left text-sm uppercase opacity-50">Apartment</th>
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  return <th key={day} className={`p-4 min-w-[55px] border-r border-white/5 text-center ${dateStr === todayStr ? 'bg-sky-500' : 'text-slate-500'}`}><p className="text-[11px] font-black">{day}</p></th>;
                })}
              </tr>
            </thead>
            <tbody>
              {apartments.map(apt => (
                <tr key={apt.id} className="group border-b border-slate-100">
                  <td className="sticky left-0 z-30 bg-white p-5 font-black text-slate-950 border-r border-slate-200 shadow-sm flex items-center gap-2"><Bed className="w-4 h-4 text-slate-400" /><span className="text-xl">U-{apt.unitNumber}</span></td>
                  {days.map(day => {
                    const booking = getBookingForDay(apt.id, day);
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    return (
                      <td key={day} onClick={() => handleSlotClick(apt.id, day)} className={`h-16 border-r border-slate-100 cursor-pointer relative group/cell ${dateStr === todayStr ? 'bg-sky-50/50' : 'hover:bg-slate-50'}`}>
                        {booking && (
                          <div className={`absolute inset-y-1 left-0 right-0 z-10 mx-0.5 rounded-lg flex items-center px-2 overflow-hidden shadow-sm transition-all group-hover/cell:scale-[1.02] ${booking.status === 'stay' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                            <span className="text-[8px] font-black uppercase truncate leading-none">{booking.startDate === dateStr ? 'START' : '•'}</span>
                            {/* SMART HIGH-CONTRAST TOOLTIP */}
                            <div className="absolute top-[-160px] left-1/2 -translate-x-1/2 w-64 bg-slate-950 border-4 border-white p-5 rounded-[2rem] shadow-2xl opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all z-[100] text-white pointer-events-none scale-90 group-hover/cell:scale-100">
                               <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-xs">U-{apt.unitNumber}</div>
                                  <div className="min-w-0">
                                     <p className="text-xs font-black uppercase truncate">{state?.customers?.find((c: any) => c.id === booking.customerId)?.name || 'Guest'}</p>
                                     <p className="text-[8px] font-black text-sky-400 uppercase mt-1">{booking.startDate} → {booking.endDate}</p>
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-black"><span className="text-slate-500 uppercase">Gross Val.</span><span className="text-emerald-400">{booking.totalAmount.toLocaleString()} {booking.currency}</span></div>
                                  <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg text-center ${booking.status === 'stay' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>Status: {booking.status}</div>
                               </div>
                               <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 border-r-4 border-b-4 border-white rotate-45"></div>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
