
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Search, X, Wallet, 
  Calendar, Zap, RefreshCw, ConciergeBell, Check, ArrowRight, UserPlus, Coins, Percent, Clock, Smartphone, Globe, Upload, Plane
} from 'lucide-react';
import { AppState, Booking, Customer, PaymentStatus, BookingStatus, Currency } from '../types';
import { PLATFORMS, PAYMENT_METHODS, CURRENCIES, NATIONALITIES } from '../constants';

interface BookingsProps {
  state: AppState;
  onAddBooking: (booking: Omit<Booking, 'id' | 'displayId'>, newCustomer?: Omit<Customer, 'id'>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
  userRole: 'admin' | 'reception';
  userName: string;
  isInternalModalOnly?: boolean;
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
  initialSelection?: { aptId: string; start: string; end: string } | null;
  initialEditId?: string | null;
}

const Bookings: React.FC<BookingsProps> = ({ 
  state, onAddBooking, onUpdateBooking, onDeleteBooking, userRole, userName, 
  isInternalModalOnly, externalModalOpen, onExternalModalClose, initialSelection, initialEditId 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    apartmentId: '', customerId: 'new',
    newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' },
    startDate: todayStr, endDate: '', checkInTime: '14:00', checkOutTime: '12:00',
    platform: 'Direct', paymentMethod: 'Cash', currency: 'EGP' as Currency,
    paidAmount: 0, totalAmount: 0, discount: 0, commissionRate: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed' as BookingStatus,
    notes: '', receptionistName: userName, selectedServiceIds: [] as string[]
  });

  useEffect(() => {
    if (externalModalOpen) setIsModalOpen(true);
    if (initialSelection) setFormData(prev => ({ ...prev, apartmentId: initialSelection.aptId, startDate: initialSelection.start, endDate: initialSelection.end }));
  }, [externalModalOpen, initialSelection]);

  useEffect(() => {
    if (initialEditId) {
      const b = state.bookings.find(x => x.id === initialEditId);
      if (b) {
        setEditingBookingId(b.id);
        setFormData({ ...b, newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' }, selectedServiceIds: b.services || [] } as any);
        setIsModalOpen(true);
      }
    }
  }, [initialEditId, state.bookings]);

  const calculateAutoValues = useMemo(() => {
    if (!formData.apartmentId || !formData.startDate || !formData.endDate) return { total: 0, nights: 0, rent: 0, services: 0 };
    const apt = state.apartments.find(a => a.id === formData.apartmentId);
    if (!apt) return { total: 0, nights: 0, rent: 0, services: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const servicePrice = formData.selectedServiceIds.reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0);
    const rent = (nights >= 30 && apt.monthlyPrice) ? apt.monthlyPrice : apt.dailyPrice * nights;
    
    return { total: rent + servicePrice - formData.discount, nights, rent, services: servicePrice };
  }, [formData, state]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBookingId(null);
    onExternalModalClose?.();
    setFormData({
      apartmentId: '', customerId: 'new',
      newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' },
      startDate: todayStr, endDate: '', checkInTime: '14:00', checkOutTime: '12:00',
      platform: 'Direct', paymentMethod: 'Cash', currency: 'EGP' as Currency,
      paidAmount: 0, totalAmount: 0, discount: 0, commissionRate: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed' as BookingStatus,
      notes: '', receptionistName: userName, selectedServiceIds: [] as string[]
    });
  };

  const totals = calculateAutoValues;

  return (
    <div className="space-y-6 font-bold pb-20">
      {!isInternalModalOnly && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#1e293b] rounded-[2rem] flex items-center justify-center text-slate-100">
                 <ConciergeBell className="w-8 h-8 text-sky-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Reservations</h2>
                 <p className="text-slate-400 text-[10px] uppercase tracking-widest">{state.bookings.length} Verified Records</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="relative w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input placeholder="Search Guest..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 ring-sky-500 outline-none font-black text-xs transition-all text-slate-800" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#1e293b] text-slate-100 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 hover:bg-sky-600 transition-all">
                 <Plus className="w-5 h-5" /> New Booking
              </button>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
           <div className="bg-[#f8fafc] rounded-[3rem] w-full max-w-7xl shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col border-4 border-slate-200 overflow-hidden">
              <div className="p-8 shrink-0 flex justify-between items-center bg-white border-b border-slate-200">
                 <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-4">
                       New Smart Reservation
                       <span className="text-[10px] bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg tracking-widest">Express Check-in</span>
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Complete details below. Live pricing is active.</p>
                 </div>
                 <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X className="w-8 h-8" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
                 <form className="flex-1 p-10 space-y-10" id="main-booking-form" onSubmit={(e) => { e.preventDefault(); const bookingData = { ...formData, totalAmount: totals.total, bookingDate: new Date().toISOString().split('T')[0], paymentStatus: (formData.paidAmount >= totals.total ? 'Paid' : formData.paidAmount > 0 ? 'Partial' : 'Unpaid') as PaymentStatus, services: formData.selectedServiceIds, fulfilledServices: [], extraServices: [] }; if (editingBookingId) onUpdateBooking(editingBookingId, bookingData); else onAddBooking(bookingData, formData.customerId === 'new' ? formData.newCustomer : undefined); closeModal(); }}>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2 col-span-full">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Full Name</label>
                             <input required placeholder="Name as per ID" className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:bg-white focus:border-slate-800 transition-all outline-none text-slate-800" value={formData.customerId === 'new' ? formData.newCustomer.name : (state.customers.find(c => c.id === formData.customerId)?.name || '')} onChange={e => { if(formData.customerId === 'new') setFormData({...formData, newCustomer: {...formData.newCustomer, name: e.target.value}}); }} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Contact</label>
                             <input required placeholder="+20..." className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:bg-white focus:border-slate-800 transition-all outline-none text-slate-800" value={formData.customerId === 'new' ? formData.newCustomer.phone : (state.customers.find(c => c.id === formData.customerId)?.phone || '')} onChange={e => { if(formData.customerId === 'new') setFormData({...formData, newCustomer: {...formData.newCustomer, phone: e.target.value}}); }} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Nationality</label>
                             <select className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" value={formData.customerId === 'new' ? formData.newCustomer.nationality : (state.customers.find(c => c.id === formData.customerId)?.nationality || 'Egyptian')} onChange={e => { if(formData.customerId === 'new') setFormData({...formData, newCustomer: {...formData.newCustomer, nationality: e.target.value}}); }}>
                                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Booked By (Employee)</label>
                             <select required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" value={formData.receptionistName} onChange={e => setFormData({...formData, receptionistName: e.target.value})}>
                                <option value="">Select Employee...</option>
                                {state.users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Booking Platform</label>
                             <select required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                             </select>
                          </div>
                       </div>
                       <div className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-white hover:border-sky-500 transition-all cursor-pointer group">
                          <Upload className="w-8 h-8 text-slate-300 group-hover:text-sky-500 mb-2" />
                          <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-sky-600">Click to scan Passport / ID</p>
                       </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                       <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-[0.3em] flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-500"/> Logistics & Unit</h4>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Check-In</label>
                             <input type="date" required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Check-Out</label>
                             <input type="date" required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                          </div>
                          <div className="space-y-2 col-span-full">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Unit Selection</label>
                             <select className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})}>
                                <option value="">Select Unit...</option>
                                {state.apartments.map(a => <option key={a.id} value={a.id}>Unit {a.unitNumber} — {a.dailyPrice} EGP/night</option>)}
                             </select>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Flight No.</label>
                             <div className="relative">
                                <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input placeholder="Optional" className="w-full pl-12 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Pax</label>
                             <div className="flex gap-2">
                                <button type="button" className="flex-1 p-5 rounded-2xl bg-[#1e293b] text-slate-100 font-black">2</button>
                                <button type="button" className="flex-1 p-5 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 font-black">0</button>
                             </div>
                          </div>
                       </div>
                    </div>
                 </form>

                 <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 p-10 flex flex-col justify-between">
                    <div className="space-y-10">
                       <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-[0.3em] flex items-center gap-2 mb-6"><Coins className="w-4 h-4 text-amber-500"/> Payment Details</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
                                <span>Unit Rent (Total)</span>
                                <span className="text-slate-800 font-black">{totals.rent.toLocaleString()} {formData.currency}</span>
                             </div>
                             <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
                                <span>Services & Add-ons</span>
                                <span className="text-slate-800 font-black">{totals.services.toLocaleString()} {formData.currency}</span>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Add-ons</label>
                          <div className="space-y-3">
                             {state.services.map(s => (
                               <label key={s.id} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer hover:bg-sky-50 transition-all border border-transparent hover:border-sky-200 ${!s.isActive ? 'hidden' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-3">
                                     <input type="checkbox" className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500" checked={formData.selectedServiceIds.includes(s.id)} onChange={() => setFormData(p => ({...p, selectedServiceIds: p.selectedServiceIds.includes(s.id) ? p.selectedServiceIds.filter(x => x !== s.id) : [...p.selectedServiceIds, s.id]}))} />
                                     <span className="text-[11px] font-black uppercase text-slate-800">{s.name}</span>
                                  </div>
                                  <span className="text-[11px] font-black text-slate-400">{s.price} {s.currency}</span>
                               </label>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Payment Method</label>
                             <select required className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none text-slate-800" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                          </div>
                          <div className="pt-4 border-t border-slate-100">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block mb-2">Deposit Paid</label>
                             <div className="relative">
                                <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-black text-4xl text-emerald-600 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} placeholder="0" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-widest">{formData.currency}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-12 space-y-6">
                       <div className="p-8 bg-[#1e293b] rounded-[2.5rem] text-slate-100 flex justify-between items-center shadow-2xl">
                          <div>
                             <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">Total Balance Due</p>
                             <p className="text-4xl font-black tracking-tighter text-sky-400">{(totals.total - formData.paidAmount).toLocaleString()}</p>
                          </div>
                          <span className="text-xl font-black opacity-20">{formData.currency}</span>
                       </div>
                       <button type="submit" form="main-booking-form" className="w-full py-8 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                          Confirm Booking
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
