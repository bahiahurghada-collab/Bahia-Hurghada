
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, X, 
  User as UserIcon, Clock, CheckCircle2, PlusCircle, User, Info, Globe, MessageSquare
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
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 rounded-xl text-white shadow-md"><CalIcon className="w-5 h-5" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-950 tracking-tighter uppercase leading-none">{monthName}</h2>
            <p className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.2em] mt-1">Occupancy Matrix V10</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selection.start && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
              <div className="px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-lg text-[9px] font-black text-sky-700 uppercase">
                {selection.start} {selection.end ? `→ ${selection.end}` : '...'}
              </div>
              {selection.end && (
                <button onClick={() => onBookingInitiate(selection.aptId, selection.start!, selection.end!)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-black uppercase text-[8px] tracking-widest shadow-md hover:bg-emerald-700 flex items-center gap-1.5 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Book</button>
              )}
              <button onClick={clearSelection} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 py-1 bg-white text-slate-950 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">Today</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950">
                <th className="sticky left-0 z-30 bg-slate-950 text-white p-4 min-w-[100px] border-r border-white/5 text-left"><span className="text-sm font-black tracking-tighter">UNITS</span></th>
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  return (
                    <th key={day} className={`p-3 min-w-[50px] border-r border-white/5 text-center ${isToday ? 'bg-sky-500 text-white' : 'text-slate-500'}`}>
                      <p className="text-[10px] font-black">{day}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {apartments.map(apt => (
                <tr key={apt.id} className="group border-b border-slate-100 last:border-0">
                  <td className="sticky left-0 z-20 bg-white p-4 font-black text-slate-900 border-r border-slate-200 shadow-sm">
                    <span className="text-lg tracking-tighter">U-{apt.unitNumber}</span>
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
                        className={`h-14 border-r border-slate-100 cursor-pointer relative transition-all group/cell ${isToday ? 'bg-sky-50/30' : 'hover:bg-slate-50'} ${isSelected ? 'bg-sky-100' : ''} ${isInSelectionRange ? 'bg-sky-50' : ''}`}
                      >
                        {booking && (
                          <div className={`absolute inset-0.5 rounded-lg flex items-center px-1 overflow-visible shadow-sm border border-black/5 transition-all group-hover/cell:scale-105 group-hover/cell:z-50 ${
                            booking.status === 'stay' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                          }`}>
                            <div className="flex flex-col w-full relative">
                               {isStart && <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-0.5">Start</span>}
                               <span className="text-[7px] font-black truncate uppercase leading-none">
                                  {isStart ? 'BOOKED' : '•'}
                               </span>

                               {/* Tooltip Card on Hover */}
                               <div className="absolute top-full left-0 mt-2 w-64 bg-white border-2 border-slate-950 p-5 rounded-2xl shadow-2xl opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all z-[100] text-slate-900 pointer-events-none scale-95 group-hover/cell:scale-100">
                                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                                     <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-[10px]">U-{apt.unitNumber}</div>
                                     <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase truncate">{state?.customers?.find((c: any) => c.id === booking.customerId)?.name || 'Guest'}</p>
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{booking.startDate} to {booking.endDate}</p>
                                     </div>
                                  </div>
                                  <div className="space-y-2">
                                     <div className="flex items-center gap-2 text-[8px] font-black uppercase text-sky-600">
                                        <Globe className="w-2.5 h-2.5" /> Channel: {booking.platform}
                                     </div>
                                     {booking.notes && (
                                       <div className="flex items-start gap-2 text-[8px] font-bold text-slate-500 bg-slate-50 p-2 rounded-lg leading-relaxed">
                                          <MessageSquare className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                                          <span className="italic">"{booking.notes}"</span>
                                       </div>
                                     )}
                                     <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-md w-fit ${booking.status === 'stay' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                        Status: {booking.status}
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </div>
                        )}
                        {isToday && <div className="absolute top-0 left-0 w-full h-0.5 bg-sky-500"></div>}
                        {isSelected && <div className="absolute inset-0 border-2 border-sky-500 rounded-lg"></div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm justify-center">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-500">In-House</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-500">Reserved</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-sky-500 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-500">Today</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-slate-200 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-500">Available</span></div>
      </div>
    </div>
  );
};

export default BookingCalendar;
