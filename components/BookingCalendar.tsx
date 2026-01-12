
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, X, Clock, PlusCircle, Bed, User, Wallet, CheckCircle
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
      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#1e293b] rounded-2xl text-slate-100 shadow-xl shadow-slate-900/10"><CalIcon className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">{monthName}</h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Operational Timeline Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {selection.start && (
            <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
              <div className="px-6 py-3 bg-[#0f172a] text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" /> {selection.start} {selection.end ? `→ ${selection.end}` : '...'}
              </div>
              {selection.end && <button onClick={() => onBookingInitiate(selection.aptId, selection.start!, selection.end!)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all border-b-4 border-emerald-800 shadow-xl">Finalize Folio</button>}
              <button onClick={() => setSelection({ aptId: '', start: null, end: null })} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><X className="w-5 h-5" /></button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-6 py-2 bg-[#1e293b] text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-sky-600">Today</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border-2 border-slate-200 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-slate-100">
                <th className="sticky left-0 z-40 bg-[#1e293b] p-6 min-w-[160px] border-r border-white/10 text-left text-xs uppercase tracking-widest opacity-60">Apartment Asset</th>
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  return (
                    <th key={day} className={`p-4 min-w-[65px] border-r border-white/5 text-center transition-all ${isToday ? 'bg-sky-600 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]' : 'text-slate-400'}`}>
                      <p className="text-[12px] font-black">{day}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {apartments.map(apt => (
                <tr key={apt.id} className="group border-b border-slate-100 last:border-0">
                  <td className="sticky left-0 z-30 bg-white p-6 font-black text-slate-800 border-r border-slate-200 shadow-lg flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-[#1e293b] group-hover:text-slate-100 transition-all duration-500">
                      <Bed className="w-5 h-5" />
                    </div>
                    <span className="text-2xl tracking-tighter">U-{apt.unitNumber}</span>
                  </td>
                  {days.map(day => {
                    const booking = getBookingForDay(apt.id, day);
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;
                    const isStart = booking?.startDate === dateStr;

                    return (
                      <td key={day} onClick={() => handleSlotClick(apt.id, day)} className={`h-20 border-r border-slate-100 cursor-pointer relative group/cell transition-all ${isToday ? 'bg-sky-50/50' : 'hover:bg-slate-50'}`}>
                        {booking && (
                          <div className={`absolute inset-y-1 left-0 right-0 z-10 mx-1 rounded-xl flex items-center px-3 overflow-hidden shadow-2xl border-b-4 transition-all duration-300 group-hover/cell:scale-[1.03] group-hover/cell:z-20 ${
                            booking.status === 'stay' ? 'bg-emerald-600 text-white border-emerald-800' : 'bg-[#2a3441] text-slate-100 border-slate-600'
                          }`}>
                            <span className="text-[9px] font-black uppercase truncate leading-none tracking-tighter">
                               {isStart ? '● START' : '•'}
                            </span>

                            <div className="absolute top-[-190px] left-1/2 -translate-x-1/2 w-72 bg-[#1e293b] border-4 border-slate-200 p-6 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all z-[100] text-slate-100 pointer-events-none scale-90 group-hover/cell:scale-100">
                               <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-sky-500/20">U-{apt.unitNumber}</div>
                                  <div className="min-w-0 flex-1">
                                     <p className="text-sm font-black uppercase truncate tracking-tight text-white">{state?.customers?.find((c: any) => c.id === booking.customerId)?.name || 'Guest'}</p>
                                     <p className="text-[9px] font-black text-sky-400 uppercase mt-1 tracking-widest">{booking.startDate} to {booking.endDate}</p>
                                  </div>
                               </div>
                               <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[11px] font-black">
                                     <span className="text-slate-400 uppercase tracking-widest">Total Valuation</span>
                                     <span className="text-emerald-400 text-base">{booking.totalAmount.toLocaleString()} <span className="text-[10px] opacity-40">{booking.currency}</span></span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-black">
                                     <span className="text-slate-400 uppercase tracking-widest">Balance Due</span>
                                     <span className="text-rose-400">{(booking.totalAmount - booking.paidAmount).toLocaleString()} {booking.currency}</span>
                                  </div>
                                  <div className={`mt-4 text-[9px] font-black uppercase px-4 py-2 rounded-xl text-center flex items-center justify-center gap-2 border ${
                                    booking.status === 'stay' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                  }`}>
                                     <CheckCircle className="w-3 h-3" /> System Status: {booking.status}
                                  </div>
                               </div>
                               <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-[#1e293b] border-r-4 border-b-4 border-slate-200 rotate-45"></div>
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
