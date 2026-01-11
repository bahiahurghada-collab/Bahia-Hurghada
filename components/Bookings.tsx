
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Building, Trash2, Edit2, Search, X, Wallet, 
  Calendar, Zap, UserCheck, RefreshCw, AlertTriangle, Hammer,
  User as UserIcon, Phone, Mail, Globe, Clock, CreditCard, StickyNote, Check,
  ConciergeBell, Eye, BadgePercent, Printer, FileText, Download
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
  const [showInvoice, setShowInvoice] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  const todayStr = '2026-01-07';

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
    else if (!isInternalModalOnly) setIsModalOpen(false);
  }, [externalModalOpen, isInternalModalOnly]);

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

  useEffect(() => {
    if (initialEditId) {
      const b = state.bookings.find(x => x.id === initialEditId);
      if (b) startEdit(b);
    }
  }, [initialEditId, state.bookings]);

  const currentApt = useMemo(() => state.apartments.find(a => a.id === formData.apartmentId), [formData.apartmentId, state.apartments]);
  const currentCust = useMemo(() => {
    if (formData.customerId === 'new') return formData.newCustomer;
    return state.customers.find(c => c.id === formData.customerId);
  }, [formData.customerId, formData.newCustomer, state.customers]);

  const finance = useMemo(() => {
    if (formData.status === 'maintenance') return { total: 0, remaining: 0, nights: 0, servicesTotal: 0, basePrice: 0 };

    if (!currentApt || !formData.startDate || !formData.endDate) return { total: 0, remaining: 0, nights: 0, servicesTotal: 0, basePrice: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    let basePrice = (nights >= 30 && currentApt.monthlyPrice > 0) ? (nights / 30) * currentApt.monthlyPrice : nights * currentApt.dailyPrice;
    
    if (formData.currency === 'USD') basePrice = basePrice / USD_TO_EGP_RATE;

    const catalogServicesTotal = state.services
      .filter(s => formData.selectedServiceIds.includes(s.id))
      .reduce((a, b) => {
        let price = b.price;
        if (formData.currency === 'USD') price = price / USD_TO_EGP_RATE;
        return a + price;
      }, 0);

    const extraServicesTotal = formData.extraServices.reduce((a, b) => a + b.price, 0);
      
    const total = Number((basePrice + catalogServicesTotal + extraServicesTotal - formData.discount).toFixed(2));
    return { 
      total, 
      remaining: Number((total - formData.paidAmount).toFixed(2)), 
      nights, 
      servicesTotal: catalogServicesTotal + extraServicesTotal,
      basePrice
    };
  }, [formData, currentApt, state.services]);

  useEffect(() => {
    if (formData.paidAmount > finance.total && finance.total > 0) {
      setAmountError(`Paid amount cannot exceed total (${finance.total} ${formData.currency})`);
    } else {
      setAmountError(null);
    }
  }, [formData.paidAmount, finance.total, formData.currency]);

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountError) return;

    const { customerId, newCustomer, selectedServiceIds, extraServices, ...rest } = formData;
    
    const newExtraServicesFromCatalog: StayService[] = state.services
      .filter(s => selectedServiceIds.includes(s.id))
      .map(s => {
        let price = s.price;
        if (formData.currency === 'USD') price = price / USD_TO_EGP_RATE;
        return {
          id: Math.random().toString(36).substr(2, 9), 
          serviceId: s.id, 
          name: s.name, 
          price: Number(price.toFixed(2)), 
          date: todayStr,
          paymentMethod: formData.paymentMethod,
          isPaid: formData.paidAmount >= finance.total
        };
      });
    
    const finalExtraServices = [...extraServices, ...newExtraServicesFromCatalog];

    if (editingBookingId) {
      onUpdateBooking(editingBookingId, { 
        ...rest, 
        customerId: customerId === 'new' ? '' : customerId,
        services: selectedServiceIds,
        extraServices: finalExtraServices, 
        totalAmount: finance.total,
        paymentStatus: finance.remaining <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Unpaid')
      });
    } else {
      onAddBooking({ 
        ...rest, 
        customerId: customerId === 'new' ? '' : customerId,
        services: selectedServiceIds,
        bookingDate: todayStr, 
        totalAmount: finance.total, 
        extraServices: finalExtraServices, 
        paymentStatus: finance.remaining <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Unpaid')
      }, customerId === 'new' ? newCustomer : undefined);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowInvoice(false);
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
      checkInTime: b.checkInTime || '14:00',
      checkOutTime: b.checkOutTime || '12:00',
      notes: b.notes || '',
      newCustomer: cust ? { 
        name: cust.name, 
        phone: cust.phone, 
        email: cust.email || '', 
        nationality: cust.nationality 
      } : { name: '', phone: '', email: '', nationality: 'Egyptian' }, 
      selectedServiceIds: b.services || [],
      extraServices: b.extraServices || []
    });
    setIsModalOpen(true);
  };

  const removeExtraService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      extraServices: prev.extraServices.filter(s => s.id !== id)
    }));
  };

  const filteredBookings = useMemo(() => {
    return state.bookings.filter(b => {
      const customer = state.customers.find(c => c.id === b.customerId);
      const apartment = state.apartments.find(a => a.id === b.apartmentId);
      const matchSearch = searchQuery === '' || 
        customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apartment?.unitNumber.includes(searchQuery);
      const matchTab = activeSubTab === 'all' || b.status === 'stay';
      return matchSearch && matchTab;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [state.bookings, searchQuery, activeSubTab, state.customers, state.apartments]);

  if (isInternalModalOnly && !isModalOpen) return null;

  return (
    <div className="space-y-10 pb-32">
      {!isInternalModalOnly && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <button onClick={() => setActiveSubTab('all')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeSubTab === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>All Reservations</button>
              <button onClick={() => setActiveSubTab('stay')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${activeSubTab === 'stay' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600'}`}><Zap className="w-4 h-4" /> In-House</button>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input placeholder="Search Guest or Unit..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-200 bg-white font-black text-sm outline-none focus:bg-white focus:border-slate-900 transition-all text-slate-950" />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:bg-black transition-all border-b-4 border-slate-950"><Plus className="w-6 h-6" /> Create Folio</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {filteredBookings.map(b => {
               const customer = state.customers.find(c => c.id === b.customerId);
               const apt = state.apartments.find(a => a.id === b.apartmentId);
               return (
                  <div key={b.id} className={`bg-white p-8 rounded-[3rem] border-2 border-slate-100 flex flex-col md:flex-row items-center justify-between hover:border-slate-900 transition-all group shadow-sm ${b.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${b.status === 'stay' ? 'bg-emerald-600 text-white' : (b.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-slate-950 text-white')}`}>{b.status}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Unit {apt?.unitNumber}</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-950 tracking-tight">{customer?.name || 'Technical Block'}</h4>
                        <p className="text-slate-500 font-bold mt-1 text-sm">{b.startDate} @ {b.checkInTime} → {b.endDate} @ {b.checkOutTime}</p>
                    </div>
                    <div className="flex items-center gap-10 mt-6 md:mt-0">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owed</p>
                          <p className="text-2xl font-black text-rose-600">{(b.totalAmount - b.paidAmount).toLocaleString()} <span className="text-xs font-bold">{b.currency}</span></p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(b)} className="p-4 bg-slate-100 text-slate-900 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => { if(window.confirm('Delete this reservation?')) onDeleteBooking(b.id) }} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                  </div>
               )
            })}
            {filteredBookings.length === 0 && <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 font-black text-slate-300 uppercase tracking-widest">No matching records</div>}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] p-0 max-w-7xl w-full shadow-2xl border-4 border-slate-950 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
            <div className="p-8 border-b-2 border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white"><ConciergeBell className="w-7 h-7" /></div>
                  <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">{showInvoice ? 'Guest Invoice View' : 'Stay Ledger Folio'}</h3>
               </div>
               <div className="flex items-center gap-4">
                  {editingBookingId && !showInvoice && (
                    <button onClick={() => setShowInvoice(true)} className="flex items-center gap-3 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-amber-600 transition-all">
                       <FileText className="w-5 h-5" /> Generate Invoice
                    </button>
                  )}
                  {showInvoice && (
                    <button onClick={() => window.print()} className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-black transition-all">
                       <Printer className="w-5 h-5" /> Print / Export PDF
                    </button>
                  )}
                  {showInvoice && (
                    <button onClick={() => setShowInvoice(false)} className="flex items-center gap-3 bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all">
                       Back to Folio
                    </button>
                  )}
                  <button onClick={closeModal} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X className="w-10 h-10 text-slate-950" /></button>
               </div>
            </div>
            
            {showInvoice ? (
               <div className="flex-1 overflow-y-auto p-20 bg-white selection:bg-amber-200" id="printable-invoice">
                  <div className="max-w-4xl mx-auto space-y-16">
                     <div className="flex justify-between items-start border-b-4 border-slate-950 pb-10">
                        <div>
                           <h1 className="text-6xl font-black text-slate-950 tracking-tighter">BAHIA<span className="text-sky-600">.</span></h1>
                           <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-400 mt-2">Hurghada Premium Stays</p>
                           <div className="mt-8 space-y-1 text-slate-500 font-bold text-sm">
                              <p>El Gouna Road, Hurghada, Egypt</p>
                              <p>+20 123 456 789</p>
                              <p>reservations@bahiahurghada.com</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">Invoice</h2>
                           <p className="text-sm font-black text-slate-400 mt-2 uppercase"># INV-{editingBookingId?.substr(-6).toUpperCase()}</p>
                           <div className="mt-10 space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Issued</p>
                              <p className="text-lg font-black text-slate-950 uppercase">{new Date().toLocaleDateString('en-GB')}</p>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-20">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-2">Guest Profile</h4>
                           <div className="space-y-1">
                              <p className="text-2xl font-black text-slate-950">{currentCust?.name}</p>
                              <p className="text-slate-500 font-bold">{currentCust?.phone}</p>
                              <p className="text-slate-500 font-bold uppercase text-xs">{currentCust?.nationality}</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-2">Stay Details</h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase">Unit</p>
                                 <p className="font-black text-slate-950">Room {currentApt?.unitNumber}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase">Nights</p>
                                 <p className="font-black text-slate-950">{finance.nights} Nights</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase">Check-In</p>
                                 <p className="font-black text-slate-950 text-xs">{formData.startDate} @ {formData.checkInTime}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase">Check-Out</p>
                                 <p className="font-black text-slate-950 text-xs">{formData.endDate} @ {formData.checkOutTime}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest">
                              <th className="p-5">Description</th>
                              <th className="p-5 text-center">Qty / Nights</th>
                              <th className="p-5 text-right">Unit Price</th>
                              <th className="p-5 text-right">Total</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                           <tr>
                              <td className="p-6">
                                 <p className="font-black text-slate-950">Room Charges (Unit {currentApt?.unitNumber})</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase">Base Stay Rate</p>
                              </td>
                              <td className="p-6 text-center font-black">{finance.nights}</td>
                              <td className="p-6 text-right font-black">{(finance.basePrice / finance.nights).toLocaleString()}</td>
                              <td className="p-6 text-right font-black">{finance.basePrice.toLocaleString()}</td>
                           </tr>
                           {formData.extraServices.map(s => (
                              <tr key={s.id}>
                                 <td className="p-6">
                                    <p className="font-black text-slate-950">{s.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Stay Amenity • {s.date}</p>
                                 </td>
                                 <td className="p-6 text-center font-black">1</td>
                                 <td className="p-6 text-right font-black">{s.price.toLocaleString()}</td>
                                 <td className="p-6 text-right font-black">{s.price.toLocaleString()}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>

                     <div className="flex justify-end pt-10">
                        <div className="w-80 space-y-4">
                           <div className="flex justify-between text-slate-500 font-black uppercase text-[10px]">
                              <span>Sub-Total</span>
                              <span className="text-slate-950 text-sm">{(finance.basePrice + finance.servicesTotal).toLocaleString()} {formData.currency}</span>
                           </div>
                           <div className="flex justify-between text-rose-600 font-black uppercase text-[10px]">
                              <span>Discount Given</span>
                              <span className="text-sm">-{formData.discount.toLocaleString()} {formData.currency}</span>
                           </div>
                           <div className="flex justify-between border-t-4 border-slate-950 pt-4 font-black">
                              <span className="text-lg uppercase tracking-tighter">Grand Total</span>
                              <span className="text-2xl">{finance.total.toLocaleString()} {formData.currency}</span>
                           </div>
                           <div className="flex justify-between text-emerald-600 font-black uppercase text-[10px] pt-2">
                              <span>Amount Paid</span>
                              <span className="text-sm">{formData.paidAmount.toLocaleString()} {formData.currency}</span>
                           </div>
                           <div className={`flex justify-between p-4 rounded-xl font-black uppercase text-[10px] ${finance.remaining > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              <span>Balance Due</span>
                              <span className="text-lg">{finance.remaining.toLocaleString()} {formData.currency}</span>
                           </div>
                        </div>
                     </div>

                     <div className="pt-20 text-center border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thank you for choosing Bahia Hurghada</p>
                        <div className="flex justify-center gap-10">
                           <div className="h-0.5 w-20 bg-slate-200"></div>
                           <div className="h-0.5 w-20 bg-slate-200"></div>
                        </div>
                     </div>
                  </div>
                  <style>{`
                    @media print {
                      body * { visibility: hidden; }
                      #printable-invoice, #printable-invoice * { visibility: visible; }
                      #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                    }
                  `}</style>
               </div>
            ) : (
               <form onSubmit={handleAddBooking} className="flex-1 overflow-y-auto p-12 space-y-12 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Operator Name</label>
                        <input required value={formData.receptionistName} onChange={e => setFormData({...formData, receptionistName: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white text-slate-950 font-black text-lg outline-none focus:border-slate-950" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Platform Source</label>
                        <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white text-slate-950 font-black text-lg outline-none">
                           {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Current Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white text-slate-950 font-black text-lg outline-none">
                           <option value="confirmed">Confirmed (Reserved)</option>
                           <option value="stay">In-House (Checked-In)</option>
                           <option value="checked_out">Checked Out</option>
                           <option value="maintenance">Maintenance Block</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Accounting Currency</label>
                        <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})} className="w-full p-4 rounded-xl border-2 border-sky-600 bg-sky-50 text-sky-950 font-black text-lg outline-none">
                           {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-10">
                        <section className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 space-y-8">
                           <div className="flex items-center justify-between">
                              <h4 className="text-xl font-black uppercase text-slate-950 flex items-center gap-3"><UserIcon className="w-6 h-6 text-sky-600" /> Guest Folio</h4>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select existing or create</span>
                           </div>
                           <div className="space-y-6">
                              <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full p-5 rounded-2xl border-2 border-slate-900 bg-white font-black text-xl shadow-lg text-slate-950">
                                 <option value="new">+ ADD NEW GUEST TO DIRECTORY</option>
                                 {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              {formData.customerId === 'new' && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                    <input required placeholder="Guest Full Name" value={formData.newCustomer.name} onChange={e => setFormData({...formData, newCustomer: {...formData.newCustomer, name: e.target.value}})} className="w-full p-4 rounded-xl bg-white border-2 border-slate-100 font-bold text-slate-950" />
                                    <input required placeholder="Mobile Phone" value={formData.newCustomer.phone} onChange={e => setFormData({...formData, newCustomer: {...formData.newCustomer, phone: e.target.value}})} className="w-full p-4 rounded-xl bg-white border-2 border-slate-100 font-bold text-slate-950" />
                                    <input placeholder="Email Address (Optional)" value={formData.newCustomer.email} onChange={e => setFormData({...formData, newCustomer: {...formData.newCustomer, email: e.target.value}})} className="col-span-1 md:col-span-2 w-full p-4 rounded-xl bg-white border-2 border-slate-100 font-bold text-slate-950" />
                                    <select value={formData.newCustomer.nationality} onChange={e => setFormData({...formData, newCustomer: {...formData.newCustomer, nationality: e.target.value}})} className="col-span-1 md:col-span-2 w-full p-4 rounded-xl bg-white border-2 border-slate-100 font-bold text-slate-950">
                                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                 </div>
                              )}
                           </div>
                        </section>
                        
                        <section className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 space-y-8">
                           <h4 className="text-xl font-black uppercase text-slate-950 flex items-center gap-3"><Building className="w-6 h-6 text-sky-600" /> Room Selection & Schedule</h4>
                           <div className="space-y-6">
                              <select required value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})} className="w-full p-5 rounded-2xl bg-white border-2 border-slate-900 font-black text-2xl shadow-lg text-slate-950 uppercase">
                                 <option value="">-- SELECT UNIT --</option>
                                 {state.apartments.map(a => <option key={a.id} value={a.id}>APARTMENT {a.unitNumber} (Floor {a.floor})</option>)}
                              </select>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="p-6 bg-white rounded-3xl space-y-4 border-2 border-slate-100">
                                    <div className="flex items-center justify-between border-b pb-2">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Arrival Schedule</p>
                                       <Clock className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full font-black text-xl outline-none text-slate-950" />
                                    <input type="time" required value={formData.checkInTime} onChange={e => setFormData({...formData, checkInTime: e.target.value})} className="w-full font-black text-lg bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-950" />
                                 </div>
                                 <div className="p-6 bg-white rounded-3xl space-y-4 border-2 border-slate-100">
                                    <div className="flex items-center justify-between border-b pb-2">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Departure Schedule</p>
                                       <Clock className="w-4 h-4 text-rose-500" />
                                    </div>
                                    <input type="date" required value={formData.endDate} min={formData.startDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full font-black text-xl outline-none text-slate-950" />
                                    <input type="time" required value={formData.checkOutTime} onChange={e => setFormData({...formData, checkOutTime: e.target.value})} className="w-full font-black text-lg bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-950" />
                                 </div>
                              </div>
                           </div>
                        </section>
                     </div>
                     
                     <div className="space-y-10">
                        <section className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 space-y-8">
                           <h4 className="text-xl font-black uppercase text-slate-950 flex items-center gap-3"><Wallet className="w-6 h-6 text-emerald-600" /> Financial Folio</h4>
                           <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Paid Amount ({formData.currency})</label>
                                    <input type="number" step="0.01" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} className={`w-full p-5 rounded-2xl bg-white border-2 font-black text-3xl outline-none shadow-sm text-slate-950 ${amountError ? 'border-rose-500 text-rose-600' : 'border-slate-100 focus:border-emerald-600'}`} />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Discount Given</label>
                                    <input type="number" value={formData.discount || ''} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full p-5 rounded-2xl bg-white border-2 border-slate-100 font-black text-3xl text-rose-600 outline-none shadow-sm" />
                                 </div>
                              </div>
                              {amountError && <p className="text-rose-600 text-[10px] font-black uppercase text-center bg-rose-50 py-2 rounded-lg border border-rose-100">{amountError}</p>}
                              
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Settlement Method</label>
                                    <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-black text-sm outline-none text-slate-950">
                                       {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Commission Amount</label>
                                    <input type="number" value={formData.commissionAmount || ''} onChange={e => setFormData({...formData, commissionAmount: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-black text-xl text-sky-600 outline-none shadow-sm" />
                                 </div>
                              </div>
                           </div>
                        </section>
                        
                        <section className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-xl font-black uppercase text-slate-950 flex items-center gap-3"><Zap className="w-6 h-6 text-sky-600" /> Amenities History</h4>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Added Services</span>
                           </div>
                           
                           <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                           {formData.extraServices.length > 0 ? formData.extraServices.map(s => (
                              <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-100">
                                 <div>
                                    <p className="font-black text-[11px] text-slate-950 uppercase">{s.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{s.date} • {s.paymentMethod}</p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="font-black text-xs text-emerald-600">{s.price} {formData.currency}</span>
                                    <button type="button" onClick={() => removeExtraService(s.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </div>
                           )) : (
                              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300 font-black text-[10px] uppercase tracking-widest">No extra services yet</div>
                           )}
                           </div>

                           <div className="border-t-2 border-slate-100 pt-6">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Add from Catalog</p>
                              <div className="grid grid-cols-1 gap-2">
                                 {state.services.map(s => {
                                    let p = s.price;
                                    if (formData.currency === 'USD') p = p / USD_TO_EGP_RATE;
                                    return (
                                    <button type="button" key={s.id} onClick={() => setFormData(p => ({...p, selectedServiceIds: p.selectedServiceIds.includes(s.id) ? p.selectedServiceIds.filter(x => x!==s.id) : [...p.selectedServiceIds, s.id]}))} className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all group ${formData.selectedServiceIds.includes(s.id) ? 'bg-slate-900 border-slate-950 text-white shadow-lg' : 'bg-white border-white text-slate-500 hover:border-slate-200'}`}>
                                       <span className="font-black uppercase text-[10px] tracking-widest">{s.name}</span>
                                       <span className={`font-black text-sm ${formData.selectedServiceIds.includes(s.id) ? 'text-sky-400' : 'text-slate-900'}`}>{p.toLocaleString()} {formData.currency}</span>
                                    </button>
                                    );
                                 })}
                              </div>
                           </div>
                        </section>
                     </div>
                  </div>

                  <div className="sticky bottom-0 bg-slate-950 rounded-[4rem] p-12 text-white flex justify-between items-center shadow-2xl border-t-8 border-slate-900">
                     <div className="flex gap-20">
                        <div className="relative">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Grand Total Bill</p>
                           <p className="text-6xl font-black tracking-tighter text-white">{finance.total.toLocaleString()} <span className="text-lg font-bold opacity-30 tracking-normal">{formData.currency}</span></p>
                           <div className="absolute -right-4 top-0 w-0.5 h-full bg-white/10"></div>
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-2">Outstanding Folio</p>
                           <p className={`text-6xl font-black tracking-tighter transition-colors ${finance.remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{finance.remaining.toLocaleString()} <span className="text-lg font-bold opacity-30 tracking-normal">{formData.currency}</span></p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                        <button type="button" onClick={closeModal} className="px-12 py-6 bg-white/5 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10">Cancel Folio</button>
                        <button type="submit" disabled={!!amountError} className={`bg-white text-slate-950 px-16 py-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl flex items-center gap-4 transition-all ${amountError ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sky-500 hover:text-white'}`}>
                           {editingBookingId ? 'Finalize Changes' : 'Commit Stay Record'} <Check className="w-7 h-7" />
                        </button>
                     </div>
                  </div>
               </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
