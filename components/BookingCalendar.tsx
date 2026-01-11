
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, X, 
  User as UserIcon, Clock, CheckCircle2, PlusCircle, User, Info, Globe, MessageSquare, Bed
} from 'lucide-react';
import { Apartment, Booking } from '../types';

interface CalendarProps {
  apartments: Apartment[];
  bookings: Booking[];
  onBookingInitiate: (aptId: string, start: string, end: string) => void;
  onEditBooking: (id: string) => void;
  customers?: any[]; // For getting names
  state?: any; // To get customer names easily
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
    return bookings.find(b => 
      b.apartmentId === aptId && 
      b.status !== 'cancelled' && 
      dateStr >= b.startDate && 
      dateStr <= b.endDate
    );
  };

  const handleSlotClick = (aptId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existing = getBookingForDay(aptId, day);
    
    if (existing) {
      onEditBooking(existing.id);
      return;
    }

    if (dateStr < todayStr) return;

    if (selection.aptId !== aptId || !selection.start || (selection.start && selection.end)) {
      setSelection({ aptId, start: dateStr, end: null });
    } else {
      if (dateStr < selection.start) {
        setSelection({ aptId, start: dateStr, end: selection.start });
      } else {
        setSelection({ ...selection, end: dateStr });
      }
    }
  };

  const clearSelection = () => setSelection({ aptId: '', start: null, end: null });

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-bold">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-950 rounded-2xl text-white shadow-lg"><CalIcon className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">{monthName}</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">Occupancy Grid | V21.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selection.start && (
            <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
              <div className="px-5 py-2.5 bg-sky-50 border border-sky-100 rounded-xl text-[10px] font-black text-sky-700 uppercase flex items-center gap-2">
                 <Clock className="w-3.5 h-3.5" /> {selection.start} {selection.end ? `→ ${selection.end}` : '...'}
              </div>
              {selection.end && (
                <button onClick={() => onBookingInitiate(selection.aptId, selection.start!, selection.end!)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 flex items-center gap-2 transition-all"><PlusCircle className="w-4 h-4" /> Finalize</button>
              )}
              <button onClick={clearSelection} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-5 py-2 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Today</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950">
                <th className="sticky left-0 z-40 bg-slate-950 text-white p-6 min-w-[120px] border-r border-white/10 text-left"><span className="text-sm font-black tracking-tighter uppercase opacity-50">Apartment</span></th>
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  return (
                    <th key={day} className={`p-4 min-w-[55px] border-r border-white/5 text-center ${isToday ? 'bg-sky-500 text-white' : 'text-slate-500'}`}>
                      <p className="text-[11px] font-black">{day}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {apartments.map(apt => (
                <tr key={apt.id} className="group border-b border-slate-100 last:border-0">
                  <td className="sticky left-0 z-30 bg-white p-5 font-black text-slate-950 border-r border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                       <Bed className="w-3.5 h-3.5 text-slate-300" />
                       <span className="text-xl tracking-tighter">U-{apt.unitNumber}</span>
                    </div>
                  </td>
                  {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const booking = getBookingForDay(apt.id, day);
                    const isToday = dateStr === todayStr;
                    const isStart = booking?.startDate === dateStr;
                    const isSelected = selection.aptId === apt.id && (dateStr === selection.start || dateStr === selection.end);
                    const isInSelectionRange = selection.aptId === apt.id && selection.start && selection.end && dateStr >= selection.start && dateStr <= selection.end;

                    return (
                      <td 
                        key={day} 
                        onClick={() => handleSlotClick(apt.id, day)}
                        className={`h-16 border-r border-slate-100 cursor-pointer relative transition-all group/cell ${isToday ? 'bg-sky-50/50' : 'hover:bg-slate-50'} ${isSelected ? 'bg-sky-100' : ''} ${isInSelectionRange ? 'bg-sky-50' : ''}`}
                      >
                        {booking && (
                          <div className={`absolute inset-1 rounded-xl flex items-center px-2 overflow-visible shadow-sm border border-black/5 transition-all group-hover/cell:scale-[1.03] group-hover/cell:z-50 ${
                            booking.status === 'stay' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                          }`}>
                            <div className="flex flex-col w-full relative">
                               {isStart && <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-0.5">Start</span>}
                               <span className="text-[8px] font-black truncate uppercase leading-none">
                                  {isStart ? 'CONFIRMED' : '•'}
                               </span>

                               {/* ENHANCED Tooltip Card on Hover */}
                               <div className="fixed mt-2 w-72 bg-white border-2 border-slate-950 p-6 rounded-[2rem] shadow-2xl opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all z-[999] text-slate-900 pointer-events-none scale-90 group-hover/cell:scale-100 transform -translate-x-1/2 left-1/2 top-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                                     <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-xs shadow-lg">U-{apt.unitNumber}</div>
                                     <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black uppercase truncate text-slate-900">{state?.customers?.find((c: any) => c.id === booking.customerId)?.name || 'Guest Record'}</p>
                                        <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mt-1">{booking.startDate} to {booking.endDate}</p>
                                     </div>
                                  </div>
                                  <div className="space-y-3">
                                     <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Channel</span>
                                        <span className="text-[10px] font-black text-slate-900 flex items-center gap-1.5"><Globe className="w-3 h-3 text-sky-500" /> {booking.platform}</span>
                                     </div>
                                     <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Financials</span>
                                        <span className="text-[10px] font-black text-emerald-600">{booking.totalAmount.toLocaleString()} {booking.currency}</span>
                                     </div>
                                     {booking.notes && (
                                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed flex items-start gap-2">
                                             <MessageSquare className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
                                             "{booking.notes}"
                                          </p>
                                       </div>
                                     )}
                                     <div className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl text-center shadow-sm ${booking.status === 'stay' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                        Status: {booking.status.replace('_', ' ')}
                                     </div>
                                  </div>
                                  {/* Arrow Decorator */}
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-slate-950 rotate-45"></div>
                               </div>
                            </div>
                          </div>
                        )}
                        {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 z-10 shadow-md shadow-sky-500/30"></div>}
                        {isSelected && <div className="absolute inset-0 border-4 border-sky-500 rounded-xl z-20"></div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 px-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm justify-center no-print">
        <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/30"></div><span className="text-[10px] font-black uppercase text-slate-500">Live Stay</span></div>
        <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 bg-slate-950 rounded-full shadow-lg shadow-black/30"></div><span className="text-[10px] font-black uppercase text-slate-500">Confirmed Booking</span></div>
        <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 bg-sky-500 rounded-full shadow-lg shadow-sky-500/30"></div><span className="text-[10px] font-black uppercase text-slate-500">Today Indicator</span></div>
        <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 border-2 border-slate-200 rounded-full"></div><span className="text-[10px] font-black uppercase text-slate-500">Available Slot</span></div>
      </div>
    </div>
  );
};

export default BookingCalendar;
