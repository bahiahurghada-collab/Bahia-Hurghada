
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Building, Trash2, Edit2, Search, X, Wallet, 
  Calendar, Zap, UserCheck, RefreshCw, AlertTriangle, Hammer,
  User as UserIcon, Phone, Mail, Globe, Clock, CreditCard, StickyNote, Check,
  ConciergeBell, Eye, BadgePercent, Printer, FileText, Download, MessageCircle, ArrowRight, TrendingUp, CheckCircle
} from 'lucide-react';
import { AppState, Booking, Customer, PaymentStatus, BookingStatus, Currency, StayService, ExtraService } from '../types';
import { PLATFORMS, PAYMENT_METHODS, CURRENCIES, NATIONALITIES, USD_TO_EGP_RATE } from '../constants';

interface BookingsProps {
  state: AppState;
  onAddBooking: (booking: Omit<Booking, 'id'>, newCustomer?: Omit<Customer, 'id'>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onCancelBooking: (id: string) => void;
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
  state, onAddBooking, onUpdateBooking, onCancelBooking, onDeleteBooking, userRole, userName, 
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
    paidAmount: 0, discount: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed' as BookingStatus,
    notes: '', receptionistName: userName, selectedServiceIds: [] as string[],
    extraServices: [] as StayService[]
  });

  useEffect(() => {
    if (externalModalOpen) setIsModalOpen(true);
  }, [externalModalOpen]);

  useEffect(() => {
    if (initialSelection) {
      setFormData(prev => ({ 
        ...prev, 
        apartmentId: initialSelection.aptId, 
        startDate: initialSelection.start, 
        endDate: initialSelection.end 
      }));
    }
  }, [initialSelection]);

  useEffect(() => {
    if (initialEditId) {
      const b = state.bookings.find(x => x.id === initialEditId);
      if (b) startEdit(b);
    }
  }, [initialEditId, state.bookings]);

  const currentApt = useMemo(() => state.apartments.find(a => a.id === formData.apartmentId), [formData.apartmentId, state.apartments]);

  const finance = useMemo(() => {
    if (!currentApt || !formData.startDate || !formData.endDate) return { total: 0, remaining: 0, nights: 0, servicesCost: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    let stayPrice = (nights >= 30 && currentApt.monthlyPrice > 0) ? (nights / 30) * currentApt.monthlyPrice : nights * currentApt.dailyPrice;
    
    // Services Cost (only selected ones from the global list)
    const servicesCost = formData.selectedServiceIds.reduce((acc, sid) => {
       const s = state.services.find(x => x.id === sid);
       return acc + (s?.price || 0);
    }, 0);

    const totalRaw = stayPrice + servicesCost - formData.discount;
    let finalTotal = totalRaw;

    if (formData.currency === 'USD') {
      finalTotal = totalRaw / USD_TO_EGP_RATE;
    }

    return { 
      total: Number(finalTotal.toFixed(2)), 
      remaining: Number((finalTotal - formData.paidAmount).toFixed(2)), 
      nights,
      servicesCost
    };
  }, [formData, currentApt, state.services]);

  const toggleService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServiceIds: prev.selectedServiceIds.includes(id) 
        ? prev.selectedServiceIds.filter(x => x !== id)
        : [...prev.selectedServiceIds, id]
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { customerId, newCustomer, selectedServiceIds, ...rest } = formData;
    
    const bookingPayload: Omit<Booking, 'id'> = {
      ...rest,
      services: selectedServiceIds,
      customerId: customerId === 'new' ? '' : customerId,
      bookingDate: todayStr,
      totalAmount: finance.total,
      paymentStatus: finance.remaining <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Unpaid')
    };

    if (editingBookingId) onUpdateBooking(editingBookingId, bookingPayload);
    else onAddBooking(bookingPayload, customerId === 'new' ? newCustomer : undefined);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBookingId(null);
    onExternalModalClose?.();
    setFormData({
      apartmentId: '', customerId: 'new', newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' },
      startDate: todayStr, endDate: '', checkInTime: '14:00', checkOutTime: '12:00',
      platform: 'Direct', paymentMethod: 'Cash', currency: 'EGP',
      paidAmount: 0, discount: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed', notes: '', receptionistName: userName, selectedServiceIds: [],
      extraServices: []
    });
  };

  const startEdit = (b: Booking) => {
    setEditingBookingId(b.id);
    const cust = state.customers.find(c => c.id === b.customerId);
    setFormData({ 
      ...b,
      customerId: b.customerId,
      newCustomer: cust ? { name: cust.name, phone: cust.phone, email: cust.email || '', nationality: cust.nationality } : formData.newCustomer,
      selectedServiceIds: b.services || [],
      checkInTime: b.checkInTime || '14:00',
      checkOutTime: b.checkOutTime || '12:00',
      notes: b.notes || '',
      extraServices: b.extraServices || []
    });
    setIsModalOpen(true);
  };

  const filteredBookings = useMemo(() => {
    return state.bookings.filter(b => {
      const customer = state.customers.find(c => c.id === b.customerId);
      return searchQuery === '' || (customer?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [state.bookings, searchQuery, state.customers]);

  return (
    <div className="space-y-6 pb-20">
      {!isInternalModalOnly && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search Guests..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border-2 border-transparent focus:border-sky-500 outline-none font-bold text-xs transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-950 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all">
            <Plus className="w-4 h-4 text-sky-400" /> New Booking
          </button>
        </div>
      )}

      {!isInternalModalOnly && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-100">
               <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                 <th className="px-6 py-4">Guest / Unit</th>
                 <th className="px-6 py-4">Dates</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4 text-right">Total</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filteredBookings.map(b => {
                 const customer = state.customers.find(c => c.id === b.customerId);
                 const apartment = state.apartments.find(a => a.id === b.apartmentId);
                 return (
                   <tr key={b.id} className="hover:bg-slate-50 transition-all group text-xs font-bold">
                     <td className="px-6 py-4">
                        <p className="font-black text-slate-900">{customer?.name || 'Unknown'}</p>
                        <p className="text-[9px] text-sky-600 uppercase">Unit {apartment?.unitNumber}</p>
                     </td>
                     <td className="px-6 py-4 text-[10px] text-slate-500">
                        {b.startDate} <ArrowRight className="inline w-2.5 h-2.5 mx-1" /> {b.endDate}
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          b.status === 'stay' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'confirmed' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {b.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <p className="font-black text-slate-900">{b.totalAmount.toLocaleString()} {b.currency}</p>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                           <button onClick={() => startEdit(b)} className="p-2 bg-slate-50 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => onDeleteBooking(b.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                     </td>
                   </tr>
                 )
               })}
             </tbody>
           </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl border-4 border-slate-950 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-950 rounded-2xl text-white"><ConciergeBell className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-slate-950 tracking-tighter uppercase leading-none">{editingBookingId ? 'Edit Folio' : 'New Reservation'}</h3>
               </div>
               <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X className="w-8 h-8 text-slate-950" /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Section: Guest & Stay */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon className="w-3 h-3" /> Guest Details</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Name</label>
                          <input required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs" value={formData.newCustomer.name} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value }})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Phone</label>
                          <input required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs" value={formData.newCustomer.phone} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, phone: e.target.value }})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Email (Optional)</label>
                          <input className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs" type="email" value={formData.newCustomer.email} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, email: e.target.value }})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Nationality</label>
                          <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs" value={formData.newCustomer.nationality} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, nationality: e.target.value }})}>
                            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building className="w-3 h-3" /> Unit & Period</h4>
                     <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-1 col-span-2">
                           <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Apartment</label>
                           <select required className="w-full p-3 rounded-xl border border-white bg-white font-black text-xs" value={formData.apartmentId} onChange={e => setFormData({ ...formData, apartmentId: e.target.value })}>
                             <option value="">Select Unit...</option>
                             {state.apartments.map(a => <option key={a.id} value={a.id}>Unit {a.unitNumber} - Floor {a.floor} - {a.view}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-slate-500 uppercase ml-1">In Date</label>
                           <input type="date" className="w-full p-3 rounded-xl border border-white bg-white font-black text-xs" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Out Date</label>
                           <input type="date" className="w-full p-3 rounded-xl border border-white bg-white font-black text-xs" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                        </div>
                     </div>
                   </div>

                   {/* Added Services Section back inside form */}
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3" /> Included Amenities</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {state.services.map(s => (
                           <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between text-left ${formData.selectedServiceIds.includes(s.id) ? 'bg-sky-500 border-sky-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-sky-200'}`}>
                              <span className="text-[10px] font-black leading-tight uppercase">{s.name}</span>
                              {formData.selectedServiceIds.includes(s.id) && <CheckCircle className="w-3 h-3" />}
                           </button>
                        ))}
                     </div>
                   </div>
                </div>

                {/* Section: Financials */}
                <div className="space-y-6">
                   <div className="bg-slate-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                      <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest mb-1">Estimated Folio Total</p>
                      <h2 className="text-4xl font-black tracking-tighter">{finance.total.toLocaleString()} <span className="text-[10px] opacity-30 uppercase">{formData.currency}</span></h2>
                      
                      <div className="mt-6 space-y-3 pt-4 border-t border-white/10">
                         <div className="flex justify-between text-[9px] font-black uppercase opacity-50">
                            <span>Nights</span>
                            <span>{finance.nights}</span>
                         </div>
                         <div className="flex justify-between text-[9px] font-black uppercase opacity-50">
                            <span>Services</span>
                            <span>{finance.servicesCost.toLocaleString()} EGP</span>
                         </div>
                         <div className="flex justify-between text-[9px] font-black uppercase text-rose-400">
                            <span>Balance</span>
                            <span>{finance.remaining.toLocaleString()} {formData.currency}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-6">
                         <select className="bg-white/5 border border-white/10 p-2 rounded-lg font-black text-[9px] outline-none" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                           {CURRENCIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                         </select>
                         <select className="bg-white/5 border border-white/10 p-2 rounded-lg font-black text-[9px] outline-none" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                           {PAYMENT_METHODS.map(m => <option key={m} value={m} className="text-slate-900">{m}</option>)}
                         </select>
                      </div>

                      <div className="mt-4">
                         <label className="text-[8px] font-black text-emerald-400 uppercase block mb-1">Paid Amount Today</label>
                         <input type="number" className="w-full p-3 bg-emerald-600 border-none rounded-xl text-white font-black text-xl outline-none" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Booking Status</label>
                        <select className="w-full p-2 rounded-lg border border-slate-200 bg-white font-black text-[9px]" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}>
                          <option value="confirmed">Confirmed</option>
                          <option value="stay">Guest Checked-In</option>
                          <option value="checked_out">Checked Out</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Platform Source</label>
                        <select className="w-full p-2 rounded-lg border border-slate-200 bg-white font-black text-[9px]" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                           {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-4 tracking-widest">Internal Notes</label>
                <textarea rows={2} className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs outline-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Special requirements..." />
              </div>

              <button type="submit" className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-sky-500 transition-all">
                Finalize Folio Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
