
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Building, Trash2, Edit2, Search, X, Wallet, 
  Calendar, Zap, UserCheck, RefreshCw, AlertTriangle, Hammer,
  User as UserIcon, Phone, Mail, Globe, Clock, CreditCard, StickyNote, Check,
  ConciergeBell, Eye, BadgePercent, Printer, FileText, Download, MessageCircle, ArrowRight
} from 'lucide-react';
import { AppState, Booking, Customer, PaymentStatus, BookingStatus, Currency, StayService } from '../types';
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
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'stay'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

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

  // التحكم في المودال الخارجي (من التايم لاين)
  useEffect(() => {
    if (externalModalOpen) setIsModalOpen(true);
    else if (!isInternalModalOnly) setIsModalOpen(false);
  }, [externalModalOpen, isInternalModalOnly]);

  // تعبئة البيانات عند الاختيار من التايم لاين
  useEffect(() => {
    if (initialSelection) {
      setFormData(prev => ({ 
        ...prev, 
        apartmentId: initialSelection.aptId, 
        startDate: initialSelection.start, 
        endDate: initialSelection.end || initialSelection.start 
      }));
    }
  }, [initialSelection]);

  // تعبئة البيانات عند التعديل
  useEffect(() => {
    if (initialEditId) {
      const b = state.bookings.find(x => x.id === initialEditId);
      if (b) startEdit(b);
    }
  }, [initialEditId, state.bookings]);

  const currentApt = useMemo(() => state.apartments.find(a => a.id === formData.apartmentId), [formData.apartmentId, state.apartments]);

  const finance = useMemo(() => {
    if (!currentApt || !formData.startDate || !formData.endDate) return { total: 0, remaining: 0, nights: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    let basePrice = (nights >= 30 && currentApt.monthlyPrice > 0) ? (nights / 30) * currentApt.monthlyPrice : nights * currentApt.dailyPrice;
    if (formData.currency === 'USD') basePrice = basePrice / USD_TO_EGP_RATE;

    const total = Number((basePrice - formData.discount).toFixed(2));
    return { total, remaining: Number((total - formData.paidAmount).toFixed(2)), nights };
  }, [formData, currentApt]);

  // Fix: Correctly mapping formData to Booking payload to resolve 'services' property error
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

    if (editingBookingId) {
      const original = state.bookings.find(b => b.id === editingBookingId);
      onUpdateBooking(editingBookingId, { 
        ...bookingPayload,
        bookingDate: original?.bookingDate || todayStr
      });
    } else {
      onAddBooking(bookingPayload, customerId === 'new' ? newCustomer : undefined);
    }
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

  // Fix: Explicitly mapping all properties and handling optional fields to resolve SetStateAction error
  const startEdit = (b: Booking) => {
    setEditingBookingId(b.id);
    const cust = state.customers.find(c => c.id === b.customerId);
    setFormData({ 
      apartmentId: b.apartmentId,
      customerId: b.customerId,
      newCustomer: cust ? { name: cust.name, phone: cust.phone, email: cust.email || '', nationality: cust.nationality } : formData.newCustomer,
      startDate: b.startDate,
      endDate: b.endDate,
      checkInTime: b.checkInTime || '14:00',
      checkOutTime: b.checkOutTime || '12:00',
      platform: b.platform,
      paymentMethod: b.paymentMethod,
      currency: b.currency,
      paidAmount: b.paidAmount,
      discount: b.discount,
      commissionAmount: b.commissionAmount,
      commissionPaid: b.commissionPaid,
      status: b.status,
      notes: b.notes || '',
      receptionistName: b.receptionistName,
      selectedServiceIds: b.services || [],
      extraServices: b.extraServices || []
    });
    setIsModalOpen(true);
  };

  const filteredBookings = useMemo(() => {
    return state.bookings.filter(b => {
      const customer = state.customers.find(c => c.id === b.customerId);
      const matchSearch = searchQuery === '' || (customer?.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTab = activeSubTab === 'all' || b.status === 'stay';
      return matchSearch && matchTab;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [state.bookings, searchQuery, activeSubTab, state.customers]);

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Search */}
      {!isInternalModalOnly && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                placeholder="Search by Guest Name..." 
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 outline-none font-bold transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-lg">
              <Plus className="w-5 h-5" /> New Booking
            </button>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      {!isInternalModalOnly && (
        <div className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-xl">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-100">
               <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                 <th className="px-10 py-6">Guest / Unit</th>
                 <th className="px-10 py-6">Period</th>
                 <th className="px-10 py-6">Status</th>
                 <th className="px-10 py-6 text-right">Finances</th>
                 <th className="px-10 py-6 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filteredBookings.map(b => {
                 const customer = state.customers.find(c => c.id === b.customerId);
                 const apartment = state.apartments.find(a => a.id === b.apartmentId);
                 return (
                   <tr key={b.id} className="hover:bg-slate-50 transition-all group">
                     <td className="px-10 py-6">
                        <p className="font-black text-slate-900 text-lg">{customer?.name || 'Unknown'}</p>
                        <p className="text-[10px] font-bold text-sky-600 uppercase">Unit {apartment?.unitNumber || 'N/A'}</p>
                     </td>
                     <td className="px-10 py-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                          <Calendar className="w-3.5 h-3.5" /> {b.startDate} <ArrowRight className="w-3 h-3" /> {b.endDate}
                        </div>
                     </td>
                     <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          b.status === 'stay' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'confirmed' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {b.status}
                        </span>
                     </td>
                     <td className="px-10 py-6 text-right">
                        <p className="font-black text-slate-900">{b.totalAmount.toLocaleString()} {b.currency}</p>
                        <p className={`text-[9px] font-black uppercase ${b.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-rose-500'}`}>{b.paymentStatus}</p>
                     </td>
                     <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => startEdit(b)} className="p-3 bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={() => onDeleteBooking(b.id)} className="p-3 bg-white border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </td>
                   </tr>
                 )
               })}
             </tbody>
           </table>
        </div>
      )}

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl shadow-2xl animate-in zoom-in-95 border-4 border-slate-900 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><ConciergeBell className="w-7 h-7" /></div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editingBookingId ? 'Edit Reservation' : 'New Reservation'}</h3>
               </div>
               <button onClick={closeModal} className="p-3 hover:bg-slate-200 rounded-full transition-all"><X className="w-10 h-10 text-slate-900" /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {/* Guest Section */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                  <UserIcon className="w-4 h-4" /> Guest Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Guest Name</label>
                    <input 
                      required 
                      className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-black text-slate-900 outline-none focus:border-slate-900"
                      value={formData.newCustomer.name}
                      onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value }})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Phone</label>
                    <input 
                      required 
                      className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-black text-slate-900 outline-none focus:border-slate-900"
                      value={formData.newCustomer.phone}
                      onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, phone: e.target.value }})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Nationality</label>
                    <select 
                      className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-black text-slate-900 outline-none focus:border-slate-900"
                      value={formData.newCustomer.nationality}
                      onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, nationality: e.target.value }})}
                    >
                      {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stay Section */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                  <Building className="w-4 h-4" /> Stay Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Unit</label>
                    <select 
                      required
                      className="w-full p-4 rounded-xl border-2 border-white bg-white font-black text-slate-900"
                      value={formData.apartmentId}
                      onChange={e => setFormData({ ...formData, apartmentId: e.target.value })}
                    >
                      <option value="">Select Unit...</option>
                      {state.apartments.map(a => <option key={a.id} value={a.id}>Unit {a.unitNumber} - Floor {a.floor}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Check-In</label>
                    <input type="date" className="w-full p-4 rounded-xl border-2 border-white bg-white font-black text-slate-900" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Check-Out</label>
                    <input type="date" className="w-full p-4 rounded-xl border-2 border-white bg-white font-black text-slate-900" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Source</label>
                    <select className="w-full p-4 rounded-xl border-2 border-white bg-white font-black text-slate-900" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Finances Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                      <Wallet className="w-4 h-4" /> Financial Ledger
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Payment Method</label>
                        <select className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-black text-slate-900" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Paid Amount</label>
                        <input type="number" className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 font-black text-xl text-emerald-950 outline-none" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} />
                      </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col justify-between">
                    <div>
                       <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Total Folio Value</p>
                       <h2 className="text-5xl font-black tracking-tighter">{finance.total.toLocaleString()} <span className="text-xs font-bold opacity-30">{formData.currency}</span></h2>
                       <div className="h-1 w-12 bg-sky-500 mt-4 rounded-full"></div>
                    </div>
                    <div className="mt-8 space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                         <span>Stay Duration</span>
                         <span>{finance.nights} Nights</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-black uppercase text-rose-400">
                         <span>Balance Due</span>
                         <span>{finance.remaining.toLocaleString()} {formData.currency}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <button type="submit" className="w-full py-8 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">
                Finalize & Secure Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
