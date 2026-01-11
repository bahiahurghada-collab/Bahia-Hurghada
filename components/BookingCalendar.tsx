
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
  // تحديث التاريخ ليكون ديناميكياً
  const todayStr = new Date().toISOString().split('T')[0];
  const [currentMonth, setCurrentMonth] = useState(new Date()); // البداية من الشهر الحالي
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
      {/* ... بقية كود المكون (لم يتغير) ... */}
    </div>
  );
};

export default BookingCalendar;
