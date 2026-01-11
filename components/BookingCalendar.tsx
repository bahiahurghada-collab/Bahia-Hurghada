
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, MessageCircle, Globe, Smartphone, Hammer, Eye, X, Wallet, User as UserIcon, Clock, CheckCircle2 } from 'lucide-react';
import { Apartment, Booking } from '../types';

interface CalendarProps {
  apartments: Apartment[];
  bookings: Booking[];
  onBookingInitiate: (aptId: string, start: string, end: string) => void;
  onEditBooking: (id: string) => void;
}

const BookingCalendar: React.FC<CalendarProps> = ({ apartments, bookings, onBookingInitiate, onEditBooking }) => {
  // التاريخ اليومي الديناميكي
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selection, setSelection] = useState<{ aptId: string; start: string | null; end: string | null }>({ aptId: '', start: null, end: null });
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const resetToToday = () => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));

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
    
    // منع الحجز في الماضي
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

  const activeHoveredBooking = bookings.find(b => b.id === hoveredBookingId);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Calendar Header */}
      <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-lg">
            <CalIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">{monthName}</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Occupancy Timeline</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <button onClick={prevMonth} className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={resetToToday} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Today</button>
          <button onClick={nextMonth} className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600"><ChevronRight className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-20 bg-slate-900 text-white p-6 min-w-[140px] border-r border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Inventory</span>
                  <span className="text-lg font-black tracking-tighter">Units</span>
                </th>
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const dayName = new Date(year, month, day).toLocaleString('en-US', { weekday: 'short' });
                  return (
                    <th key={day} className={`p-4 min-w-[60px] border-r border-slate-100 text-center transition-colors ${isToday ? 'bg-sky-500 text-white' : ''}`}>
                      <p className="text-[9px] font-black uppercase tracking-tighter opacity-60 mb-1">{dayName}</p>
                      <p className="text-xl font-black">{day}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {apartments.map(apt => (
                <tr key={apt.id} className="border-b border-slate-50 group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 p-6 font-black text-slate-900 border-r-2 border-slate-100 shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col">
                      <span className="text-xl tracking-tighter">U-{apt.unitNumber}</span>
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Floor {apt.floor}</span>
                    </div>
                  </td>
                  {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const booking = getBookingForDay(apt.id, day);
                    const isToday = dateStr === todayStr;
                    const isSelected = selection.aptId === apt.id && (dateStr === selection.start || dateStr === selection.end);
                    const isInSelectionRange = selection.aptId === apt.id && selection.start && selection.end && dateStr >= selection.start && dateStr <= selection.end;

                    return (
                      <td 
                        key={day} 
                        onClick={() => handleSlotClick(apt.id, day)}
                        className={`
                          h-20 border-r border-slate-50 cursor-pointer relative transition-all duration-300
                          ${isToday ? 'bg-sky-50/50' : 'hover:bg-slate-50'}
                          ${isSelected ? 'bg-sky-600 !border-sky-700' : ''}
                          ${isInSelectionRange ? 'bg-sky-400 !border-sky-500' : ''}
                        `}
                      >
                        {booking && (
                          <div 
                            className={`
                              absolute inset-1 rounded-xl flex items-center justify-center shadow-md overflow-hidden
                              ${booking.status === 'stay' ? 'bg-emerald-600 text-white shadow-emerald-200' : 
                                booking.status === 'checked_out' ? 'bg-slate-200 text-slate-500 shadow-none' :
                                'bg-slate-900 text-white shadow-slate-200'}
                            `}
                          >
                            <span className="text-[10px] font-black uppercase tracking-tighter truncate px-2">
                              {booking.status === 'stay' ? 'IN-HOUSE' : 'BOOKED'}
                            </span>
                          </div>
                        )}
                        {isSelected && !booking && (
                          <div className="absolute inset-1 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                            <CheckCircle2 className="w-5 h-5 text-white" />
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

      {/* Booking Quick View Popup */}
      {activeHoveredBooking && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 border-4 border-slate-900">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Booking Summary</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-3">Active Folio</p>
              </div>
              <button onClick={() => setHoveredBookingId(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-8 h-8 text-slate-900" /></button>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center gap-6 border-2 border-slate-100">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Guest Name</p>
                    <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Guest Folio Data</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span className="text-[9px] font-black text-sky-600 uppercase">Stay Duration</span>
                    </div>
                    <p className="text-sm font-black text-sky-950">{activeHoveredBooking.startDate} <span className="text-[10px] opacity-40">TO</span> {activeHoveredBooking.endDate}</p>
                  </div>
                  <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase">Total Value</span>
                    </div>
                    <p className="text-lg font-black text-emerald-950">{activeHoveredBooking.totalAmount.toLocaleString()} <span className="text-[10px] opacity-40">{activeHoveredBooking.currency}</span></p>
                  </div>
               </div>

               <div className="flex gap-4">
                 <button 
                   onClick={() => { onEditBooking(activeHoveredBooking.id); setHoveredBookingId(null); }}
                   className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl"
                 >
                   Manage Details
                 </button>
                 <button 
                   onClick={() => window.open(`https://wa.me/?text=Hello, this is regarding your booking at Bahia Hurghada...`, '_blank')}
                   className="p-5 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg"
                 >
                   <MessageCircle className="w-6 h-6" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">In-House</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-slate-200 rounded-full"></div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
