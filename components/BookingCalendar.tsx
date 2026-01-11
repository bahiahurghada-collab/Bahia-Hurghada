
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, MessageCircle, X, 
  Wallet, User as UserIcon, Clock, CheckCircle2, Navigation2 
} from 'lucide-react';
import { Apartment, Booking } from '../types';

interface CalendarProps {
  apartments: Apartment[];
  bookings: Booking[];
  onBookingInitiate: (aptId: string, start: string, end: string) => void;
  onEditBooking: (id: string) => void;
}

const BookingCalendar: React.FC<CalendarProps> = ({ apartments, bookings, onBookingInitiate, onEditBooking }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selection, setSelection] = useState<{ aptId: string; start: string | null; end: string | null }>({ aptId: '', start: null, end: null });
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);

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
    if (dateStr < todayStr) return;

    const existing = getBookingForDay(aptId, day);
    if (existing) {
      setHoveredBookingId(existing.id);
      return;
    }

    if (selection.aptId !== aptId || !selection.start || (selection.start && selection.end)) {
      setSelection({ aptId, start: dateStr, end: null });
    } else {
      if (dateStr < selection.start) {
        setSelection({ aptId, start: dateStr, end: selection.start });
      } else if (dateStr === selection.start) {
        setSelection({ aptId: '', start: null, end: null });
      } else {
        onBookingInitiate(aptId, selection.start, dateStr);
        setSelection({ aptId: '', start: null, end: null });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Calendar Controller */}
      <div className="bg-white p-8 rounded-[3.5rem] border-2 border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
            <CalIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">{monthName}</h2>
            <div className="flex items-center gap-2 mt-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Live Occupancy Matrix</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100 shadow-inner">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Current Month</button>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600"><ChevronRight className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Grid Display */}
      <div className="bg-white rounded-[3.5rem] border-4 border-slate-900 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-900">
                <th className="sticky left-0 z-30 bg-slate-900 text-white p-6 min-w-[160px] border-r border-white/10 text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1">Portfolio</span>
                  <span className="text-xl font-black tracking-tighter">Inventory</span>
                </th>
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const dayName = new Date(year, month, day).toLocaleString('en-US', { weekday: 'short' });
                  return (
                    <th key={day} className={`p-4 min-w-[70px] border-r border-white/5 text-center transition-all ${isToday ? 'bg-sky-500 text-white' : 'text-slate-400'}`}>
                      <p className="text-[9px] font-black uppercase tracking-tighter opacity-50 mb-1">{dayName}</p>
                      <p className="text-2xl font-black">{day}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {apartments.map(apt => (
                <tr key={apt.id} className="group">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-6 font-black text-slate-950 border-r-4 border-slate-900 shadow-[10px_0_20px_rgba(0,0,0,0.05)] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-2xl tracking-tighter">U-{apt.unitNumber}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Floor {apt.floor}</span>
                    </div>
                  </td>
                  {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const booking = getBookingForDay(apt.id, day);
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;
                    const isSelected = selection.aptId === apt.id && (dateStr === selection.start || dateStr === selection.end);
                    const isInSelectionRange = selection.aptId === apt.id && selection.start && selection.end && dateStr >= selection.start && dateStr <= selection.end;

                    return (
                      <td 
                        key={day} 
                        onClick={() => handleSlotClick(apt.id, day)}
                        className={`
                          h-24 border-r border-b border-slate-100 cursor-pointer relative transition-all duration-300
                          ${isPast ? 'bg-slate-50/50 grayscale opacity-50' : 'hover:bg-slate-50'}
                          ${isToday ? 'bg-sky-50/70 border-l-2 border-r-2 border-sky-200' : ''}
                          ${isSelected ? 'bg-sky-600 !border-sky-800' : ''}
                          ${isInSelectionRange ? 'bg-sky-400 !border-sky-500 shadow-inner' : ''}
                        `}
                      >
                        {booking && (
                          <div 
                            className={`
                              absolute inset-1.5 rounded-2xl flex flex-col items-center justify-center shadow-lg transform transition-transform hover:scale-[1.02] active:scale-95
                              ${booking.status === 'stay' ? 'bg-emerald-600 text-white shadow-emerald-200' : 
                                booking.status === 'checked_out' ? 'bg-slate-200 text-slate-500 shadow-none' :
                                'bg-slate-900 text-white shadow-slate-300'}
                            `}
                          >
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 leading-none">
                              {booking.status === 'stay' ? 'IN-HOUSE' : 'BOOKED'}
                            </span>
                            <span className="text-[10px] font-black uppercase truncate px-2">
                              GUEST FOLIO
                            </span>
                          </div>
                        )}
                        {isSelected && !booking && (
                          <div className="absolute inset-1.5 bg-white/30 rounded-2xl flex items-center justify-center animate-pulse border-2 border-white/50">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </div>
                        )}
                        {isToday && (
                           <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-sky-500 text-white text-[7px] font-black rounded-full uppercase tracking-widest shadow-md">Today</div>
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

      {/* Booking Quick View Popup */}
      {hoveredBookingId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 border-4 border-slate-900">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-white"><Navigation2 className="w-6 h-6" /></div>
                <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Stay Intel</h3>
              </div>
              <button onClick={() => setHoveredBookingId(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-10 h-10 text-slate-900" /></button>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-50 p-6 rounded-[2.5rem] flex items-center gap-6 border-2 border-slate-100">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-sm border-2 border-slate-100">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Guest</p>
                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Active Reservation</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-sky-50 rounded-3xl border-2 border-sky-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span className="text-[9px] font-black text-sky-600 uppercase">Period</span>
                    </div>
                    <p className="text-sm font-black text-sky-950">Active Stay Dates</p>
                  </div>
                  <div className="p-5 bg-emerald-50 rounded-3xl border-2 border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase">Folio Value</span>
                    </div>
                    <p className="text-lg font-black text-emerald-950">Financial Data</p>
                  </div>
               </div>

               <button 
                 onClick={() => { onEditBooking(hoveredBookingId!); setHoveredBookingId(null); }}
                 className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl"
               >
                 Open Full Folio Details
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-8 px-8 bg-white/50 p-6 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-emerald-600 rounded-lg shadow-sm shadow-emerald-200"></div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">In-House Stay</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-slate-900 rounded-lg shadow-sm shadow-slate-200"></div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Upcoming Booked</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-sky-500 rounded-lg shadow-sm shadow-sky-200"></div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Current Day (Today)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-slate-200 rounded-lg"></div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Available Unit</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
