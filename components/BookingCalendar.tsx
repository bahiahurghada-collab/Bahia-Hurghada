
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, MessageCircle, Globe, Smartphone, Hammer, Eye, X, Wallet } from 'lucide-react';
import { Apartment, Booking } from '../types';

interface CalendarProps {
  apartments: Apartment[];
  bookings: Booking[];
  onBookingInitiate: (aptId: string, start: string, end: string) => void;
  onEditBooking: (id: string) => void;
}

const BookingCalendar: React.FC<CalendarProps> = ({ apartments, bookings, onBookingInitiate, onEditBooking }) => {
  const todayStr = '2026-01-07';
  const [currentMonth, setCurrentMonth] = useState(new Date('2026-01-01'));
  const [selection, setSelection] = useState<{ aptId: string; start: string | null; end: string | null }>({ aptId: '', start: null, end: null });
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  const getBookingForDay = (aptId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.find(b => b.apartmentId === aptId && b.status !== 'cancelled' && dateStr >= b.startDate && dateStr <= b.endDate);
  };

  const handleSlotClick = (aptId: string, date: string) => {
    if (date < todayStr) return;
    const existing = bookings.find(b => b.apartmentId === aptId && b.status !== 'cancelled' && (date >= b.startDate && date <= b.endDate));
    
    if (existing) {
      setHoveredBookingId(existing.id);
      return;
    }

    if (selection.aptId !== aptId || !selection.start || (selection.start && selection.end)) {
      setSelection({ aptId, start: date, end: null });
    } else {
      if (date < selection.start) setSelection({ aptId, start: date, end: selection.start });
      else if (date === selection.start) setSelection({ aptId: '', start: null, end: null });
      else setSelection({ ...selection, end: date });
    }
  };

  const activeHoveredBooking = bookings.find(b => b.id === hoveredBookingId);

  return (
    <div className="bg-white rounded-[3.5rem] border-4 border-slate-900 shadow-2xl overflow-hidden animate-in fade-in duration-700 relative">
      <div className="p-8 border-b-2 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-white sticky left-0 z-40">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-xl relative overflow-hidden">
             <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-sky-500/30"></div>
             <CalIcon className="w-8 h-8 relative z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Stay Matrix</h2>
            <p className="text-sky-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 bg-slate-50 px-8 py-4 rounded-[2rem] border-2 border-slate-100">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">In House</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-600 rounded-full"></div><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Maintenance</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700 rounded-full"></div><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Occupied</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-emerald-400 bg-white rounded-full"></div><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Available</span></div>
        </div>

        <div className="flex items-center gap-3">
          {selection.start && (
            <button onClick={() => { onBookingInitiate(selection.aptId, selection.start!, selection.end || selection.start!); setSelection({aptId: '', start: null, end: null}); }} className="bg-sky-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-sky-500 transition-all border-b-4 border-sky-800 animate-pulse">Confirm Stay</button>
          )}
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto relative custom-scrollbar bg-slate-50/30">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100/30">
              <th className="sticky left-0 z-30 bg-white px-8 py-8 text-left text-[11px] font-black text-slate-400 border-b-2 border-r-2 border-slate-100 min-w-[200px] uppercase tracking-[0.4em]">Asset/Room</th>
              {days.map(day => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return <th key={day} className={`px-2 py-6 text-[11px] font-black border-b-2 border-slate-100 min-w-[150px] text-center ${dateStr === todayStr ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400'}`}>{day}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {apartments.map(apt => (
              <tr key={apt.id} className="group">
                <td className="sticky left-0 z-20 bg-white px-8 py-8 border-b-2 border-r-2 border-slate-50 font-black text-slate-950 text-2xl group-hover:bg-slate-50 transition-colors">
                  U-{apt.unitNumber}
                </td>
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const booking = getBookingForDay(apt.id, day);
                  const isPast = dateStr < todayStr;
                  const isSelected = selection.aptId === apt.id && (dateStr === selection.start || dateStr === selection.end || (selection.start && selection.end && dateStr > selection.start && dateStr < selection.end));

                  let cellClass = "bg-white border-emerald-100/30 hover:bg-emerald-50/50";
                  let label = "AVAILABLE";
                  let subLabel = "";
                  
                  if (booking) {
                    subLabel = booking.platform;
                    if (booking.status === 'maintenance') {
                       cellClass = "bg-rose-600 border-rose-700 shadow-inner";
                       label = "MAINTENANCE";
                    } else if (booking.status === 'stay') {
                       cellClass = "animate-stay-glow border-emerald-400 shadow-inner";
                       label = "IN-HOUSE";
                    } else if (booking.status === 'cancelled') {
                       cellClass = "bg-white border-emerald-100/30";
                       label = "AVAILABLE";
                       subLabel = "";
                    } else {
                       cellClass = "bg-slate-700 border-slate-800";
                       label = "BOOKED";
                    }
                  } else if (isSelected) {
                    cellClass = "bg-sky-500 border-sky-400 ring-2 ring-white scale-105 z-10";
                    label = "SELECTED";
                  } else if (isPast) {
                    cellClass = "bg-slate-100 opacity-20 cursor-not-allowed border-transparent";
                    label = "PAST";
                  }

                  return (
                    <td key={day} onClick={() => handleSlotClick(apt.id, dateStr)} className="p-1.5 border-b-2 border-slate-50 transition-all cursor-pointer">
                      <div className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 ${cellClass} border-2 transition-all duration-300 relative overflow-hidden px-2`}>
                        <span className={`text-[8px] font-black leading-tight uppercase truncate w-full text-center tracking-widest ${booking || isSelected ? 'text-white' : 'text-slate-300'}`}>
                           {label}
                        </span>
                        {subLabel && (
                          <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter truncate w-full text-center">
                            {subLabel}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Quick Detail Overlay */}
      {activeHoveredBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border-4 border-slate-950 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Stay Reference</h3>
                 <button onClick={() => setHoveredBookingId(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-8 h-8" /></button>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                       U-{apartments.find(a => a.id === activeHoveredBooking.apartmentId)?.unitNumber}
                    </div>
                    <div>
                       <p className="text-2xl font-black text-slate-950 uppercase">{activeHoveredBooking.status}</p>
                       <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{activeHoveredBooking.startDate} TO {activeHoveredBooking.endDate}</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paid Amount</p>
                       <p className="text-xl font-black text-slate-950">{activeHoveredBooking.paidAmount.toLocaleString()} <span className="text-xs opacity-30">{activeHoveredBooking.currency}</span></p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform Origin</p>
                       <p className="text-xl font-black text-sky-600">{activeHoveredBooking.platform}</p>
                    </div>
                 </div>
                 <button onClick={() => { onEditBooking(activeHoveredBooking.id); setHoveredBookingId(null); }} className="w-full bg-slate-950 text-white py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all">
                    <Eye className="w-5 h-5" /> Detailed Folio Entry
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
