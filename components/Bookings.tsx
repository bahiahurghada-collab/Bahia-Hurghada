
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Search, X, Wallet, 
  Calendar, Zap, RefreshCw, ConciergeBell, Check, ArrowRight, UserPlus, Coins, Percent, Clock
} from 'lucide-react';
import { AppState, Booking, Customer, PaymentStatus, BookingStatus, Currency } from '../types';
import { PLATFORMS, PAYMENT_METHODS, CURRENCIES, NATIONALITIES } from '../constants';

// Added onCancelBooking to BookingsProps to fix type definition error when passed from App.tsx
interface BookingsProps {
  state: AppState;
  onAddBooking: (booking: Omit<Booking, 'id' | 'displayId'>, newCustomer?: Omit<Customer, 'id'>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
  onCancelBooking?: (id: string) => void;
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
        setFormData({ 
          ...b, 
          newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' },
          selectedServiceIds: b.services || []
        } as any);
        setIsModalOpen(true);
      }
    }
  }, [initialEditId, state.bookings]);

  const calculateAutoValues = useMemo(() => {
    if (!formData.apartmentId || !formData.startDate || !formData.endDate) return { total: 0, nights: 0 };
    const apt = state.apartments.find(a => a.id === formData.apartmentId);
    if (!apt) return { total: 0, nights: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const servicePrice = formData.selectedServiceIds.reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0);
    const baseTotal = (nights >= 30 && apt.monthlyPrice) ? apt.monthlyPrice : apt.dailyPrice * nights;
    
    return { total: baseTotal + servicePrice - formData.discount, nights };
  }, [formData, state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTotal = calculateAutoValues.total;
    const bookingData = {
      ...formData,
      totalAmount: finalTotal,
      bookingDate: new Date().toISOString().split('T')[0],
      paymentStatus: (formData.paidAmount >= finalTotal ? 'Paid' : formData.paidAmount > 0 ? 'Partial' : 'Unpaid') as PaymentStatus,
      services: formData.selectedServiceIds,
      fulfilledServices: [],
      extraServices: []
    };

    if (editingBookingId) onUpdateBooking(editingBookingId, bookingData);
    else onAddBooking(bookingData, formData.customerId === 'new' ? formData.newCustomer : undefined);
    closeModal();
  };

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

  const filteredBookings = useMemo(() => {
    return state.bookings.filter(b => {
      const customer = state.customers.find(c => c.id === b.customerId);
      return searchQuery === '' || (customer?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [state, searchQuery]);

  return (
    <div className="space-y-6 font-bold pb-20">
      {!isInternalModalOnly && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
                 <ConciergeBell className="w-8 h-8 text-sky-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Reservations Desk</h2>
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> {state.bookings.length} TOTAL FOLIOS
                 </p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="relative w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input placeholder="Filter Folios..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-sky-500 outline-none font-black text-xs transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 hover:bg-sky-500 transition-all">
                 <Plus className="w-5 h-5" /> New Booking
              </button>
           </div>
        </div>
      )}

      {!isInternalModalOnly && (
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-100">
               <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                 <th className="px-10 py-6">Guest / Unit</th>
                 <th className="px-10 py-6">Stay Window</th>
                 <th className="px-10 py-6">Status</th>
                 <th className="px-10 py-6 text-right">Settlement</th>
                 <th className="px-10 py-6 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filteredBookings.map(b => (
                 <tr key={b.id} className="hover:bg-slate-50 transition-all group">
                   <td className="px-10 py-5">
                      <p className="font-black text-slate-950 text-base uppercase">{state.customers.find(c => c.id === b.customerId)?.name || 'Guest'}</p>
                      <p className="text-[9px] font-black text-sky-600 uppercase mt-1">UNIT {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber} • #{b.displayId}</p>
                   </td>
                   <td className="px-10 py-5 text-xs text-slate-600 font-black">{b.startDate} → {b.endDate}</td>
                   <td className="px-10 py-5">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${b.status === 'stay' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                        {b.status}
                      </span>
                   </td>
                   <td className="px-10 py-5 text-right">
                      <p className="text-xl font-black text-slate-950">{b.totalAmount.toLocaleString()} <span className="text-[10px] opacity-40">{b.currency}</span></p>
                      <p className={`text-[9px] font-black mt-1 uppercase ${b.paidAmount >= b.totalAmount ? 'text-emerald-500' : 'text-rose-500'}`}>
                         Balance: {(b.totalAmount - b.paidAmount).toLocaleString()}
                      </p>
                   </td>
                   <td className="px-10 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => { setEditingBookingId(b.id); setIsModalOpen(true); }} className="p-3 bg-white text-slate-400 hover:text-sky-600 rounded-xl shadow-sm border border-slate-100"><Edit2 className="w-4 h-4" /></button>
                         <button onClick={() => {if(window.confirm('Delete Folio?')) onDeleteBooking(b.id);}} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-sm border border-slate-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[4rem] p-12 max-w-5xl w-full border-4 border-slate-950 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-8 sticky top-0 bg-white z-10">
                 <div>
                    <h3 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">{editingBookingId ? 'Modify Reservation' : 'New Folio Entry'}</h3>
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-2">Bahia Hurghada Smart PMS V19.0 Logic</p>
                 </div>
                 <button onClick={closeModal} className="p-4 hover:bg-slate-100 rounded-full transition-all"><X className="w-10 h-10 text-slate-950" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Section 1: Identity & Unit */}
                    <div className="space-y-8">
                       <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Identity & Unit</h4>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Target Apartment</label>
                             <select required className="w-full p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm font-black text-slate-950 outline-none focus:border-sky-500 transition-all" value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})}>
                                <option value="">Select Asset...</option>
                                {state.apartments.map(a => <option key={a.id} value={a.id}>Unit {a.unitNumber} - {a.view}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Guest Record</label>
                             <select className="w-full p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm font-black text-slate-950 outline-none focus:border-sky-500 transition-all" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                                <option value="new">+ Register New Identity</option>
                                {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                          </div>
                          {formData.customerId === 'new' && (
                             <div className="p-6 bg-sky-50 rounded-3xl border-2 border-sky-100 space-y-4 animate-in slide-in-from-top-4">
                                <input required placeholder="Guest Full Name" className="w-full p-4 rounded-xl border border-sky-200 font-bold" value={formData.newCustomer.name} onChange={e => setFormData({...formData, newCustomer: {...formData.newCustomer, name: e.target.value}})} />
                                <input required placeholder="Contact Phone" className="w-full p-4 rounded-xl border border-sky-200 font-bold" value={formData.newCustomer.phone} onChange={e => setFormData({...formData, newCustomer: {...formData.newCustomer, phone: e.target.value}})} />
                                <select className="w-full p-4 rounded-xl border border-sky-200 font-bold" value={formData.newCustomer.nationality} onChange={e => setFormData({...formData, newCustomer: {...formData.newCustomer, nationality: e.target.value}})}>
                                   {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                             </div>
                          )}
                       </div>

                       <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><Zap className="w-4 h-4"/> Service Selection</h4>
                          <div className="grid grid-cols-2 gap-3">
                             {state.services.map(s => (
                                <button key={s.id} type="button" onClick={() => setFormData(p => ({...p, selectedServiceIds: p.selectedServiceIds.includes(s.id) ? p.selectedServiceIds.filter(x => x !== s.id) : [...p.selectedServiceIds, s.id]}))} className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all flex justify-between items-center ${formData.selectedServiceIds.includes(s.id) ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-sky-500'}`}>
                                   {s.name}
                                   {formData.selectedServiceIds.includes(s.id) && <Check className="w-4 h-4 text-sky-400" />}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Section 2: Timeline & Logistics */}
                    <div className="space-y-8">
                       <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><Calendar className="w-4 h-4"/> Timeline Logistics</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Start Date</label>
                                <input type="date" required className="w-full p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm font-black text-slate-950 outline-none focus:border-sky-500 transition-all" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">End Date</label>
                                <input type="date" required className="w-full p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm font-black text-slate-950 outline-none focus:border-sky-500 transition-all" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Channel</label>
                                <select className="w-full p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm font-black text-slate-950 outline-none focus:border-sky-500 transition-all" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                                   {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">System Status</label>
                                <select className="w-full p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm font-black text-slate-950 outline-none focus:border-sky-500 transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}>
                                   <option value="confirmed">Confirmed / OK</option>
                                   <option value="stay">Active / In-House</option>
                                   <option value="pending">Pending Settlement</option>
                                </select>
                             </div>
                          </div>
                       </div>

                       <div className="p-8 bg-slate-950 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                          <Coins className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 rotate-12" />
                          <div className="grid grid-cols-2 gap-8 relative z-10">
                             <div>
                                <label className="text-[9px] font-black uppercase text-sky-400 tracking-widest block mb-2">Calculated Gross</label>
                                <div className="text-4xl font-black tracking-tighter text-white">{calculateAutoValues.total.toLocaleString()} <span className="text-xs opacity-40">{formData.currency}</span></div>
                                <div className="text-[9px] font-black text-slate-500 mt-2 uppercase">{calculateAutoValues.nights} NIGHTS AUDITED</div>
                             </div>
                             <div>
                                <label className="text-[9px] font-black uppercase text-sky-400 tracking-widest block mb-2">Advance Paid</label>
                                <input type="number" className="w-full bg-white/10 border-2 border-white/5 rounded-2xl p-4 font-black text-3xl text-emerald-400 outline-none focus:border-emerald-500" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} />
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-8 relative z-10">
                             <div>
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-2">Commission (Sales)</label>
                                <input type="number" className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-4 font-black text-xl text-sky-500 outline-none focus:border-sky-500" value={formData.commissionAmount || ''} onChange={e => setFormData({...formData, commissionAmount: Number(e.target.value)})} />
                             </div>
                             <div>
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-2">Currency</label>
                                <select className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-4 font-black text-xl" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                                   {CURRENCIES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-sky-600 transition-all border-b-8 border-slate-900 group flex items-center justify-center gap-4">
                    Commit Folio Transaction <ArrowRight className="w-6 h-6 group-hover:translate-x-4 transition-all" />
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
