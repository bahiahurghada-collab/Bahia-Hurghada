
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Building, Trash2, Edit2, Search, X, Wallet, 
  Calendar, Zap, UserCheck, RefreshCw, AlertTriangle, Hammer,
  User as UserIcon, Phone, Mail, Globe, Clock, CreditCard, StickyNote, Check,
  ConciergeBell, Eye, BadgePercent, Printer, FileText, Download, MessageCircle, ArrowRight, TrendingUp, CheckCircle, Timer, Percent, Users, ReceiptText
} from 'lucide-react';
import { AppState, Booking, Customer, PaymentStatus, BookingStatus, Currency, StayService, ExtraService } from '../types';
import { PLATFORMS, PAYMENT_METHODS, CURRENCIES, NATIONALITIES, USD_TO_EGP_RATE } from '../constants';

interface BookingsProps {
  state: AppState;
  onAddBooking: (booking: Omit<Booking, 'id' | 'displayId'>, newCustomer?: Omit<Customer, 'id'>) => void;
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
  const [showInvoice, setShowInvoice] = useState<Booking | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    apartmentId: '', customerId: 'new',
    newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' },
    startDate: todayStr, endDate: '', checkInTime: '14:00', checkOutTime: '12:00',
    platform: 'Direct', paymentMethod: 'Cash', currency: 'EGP' as Currency,
    paidAmount: 0, discount: 0, commissionRate: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed' as BookingStatus,
    notes: '', receptionistName: userName, selectedServiceIds: [] as string[],
    extraServices: [] as StayService[],
    fulfilledServices: [] as string[]
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
    if (!currentApt || !formData.startDate || !formData.endDate) return { total: 0, remaining: 0, nights: 0, servicesCost: 0, commissionCalculated: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    let stayPrice = (nights >= 30 && currentApt.monthlyPrice > 0) ? (nights / 30) * currentApt.monthlyPrice : nights * currentApt.dailyPrice;
    
    const servicesCost = formData.selectedServiceIds.reduce((acc, sid) => {
       const s = state.services.find(x => x.id === sid);
       return acc + (s?.price || 0);
    }, 0);

    const totalRaw = stayPrice + servicesCost - formData.discount;
    let finalTotal = totalRaw;

    if (formData.currency === 'USD') {
      finalTotal = totalRaw / USD_TO_EGP_RATE;
    }

    const commissionCalculated = Number((finalTotal * (formData.commissionRate / 100)).toFixed(2));

    return { 
      total: Number(finalTotal.toFixed(2)), 
      remaining: Number((finalTotal - formData.paidAmount).toFixed(2)), 
      nights,
      servicesCost,
      commissionCalculated
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

  const handleGuestSelect = (cid: string) => {
    if (cid === 'new') {
      setFormData(prev => ({ 
        ...prev, 
        customerId: 'new', 
        newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' } 
      }));
    } else {
      const guest = state.customers.find(c => c.id === cid);
      if (guest) {
        setFormData(prev => ({ 
          ...prev, 
          customerId: cid, 
          newCustomer: { 
            name: guest.name, 
            phone: guest.phone, 
            email: guest.email || '', 
            nationality: guest.nationality 
          } 
        }));
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { customerId, newCustomer, selectedServiceIds, ...rest } = formData;
    
    const bookingPayload: Omit<Booking, 'id' | 'displayId'> = {
      ...rest,
      services: selectedServiceIds,
      customerId: customerId === 'new' ? '' : customerId,
      bookingDate: todayStr,
      totalAmount: finance.total,
      commissionAmount: finance.commissionCalculated,
      paymentStatus: finance.remaining <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Unpaid'),
      receptionistName: rest.receptionistName || userName
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
      paidAmount: 0, discount: 0, commissionRate: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed', notes: '', receptionistName: userName, selectedServiceIds: [],
      extraServices: [],
      fulfilledServices: []
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
      extraServices: b.extraServices || [],
      fulfilledServices: b.fulfilledServices || []
    });
    setIsModalOpen(true);
  };

  const printInvoice = () => {
    window.print();
  };

  const filteredBookings = useMemo(() => {
    return state.bookings.filter(b => {
      const customer = state.customers.find(c => c.id === b.customerId);
      return searchQuery === '' || (customer?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [state.bookings, searchQuery, state.customers]);

  return (
    <div className="space-y-4 pb-20">
      {!isInternalModalOnly && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search guests or folios..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border-2 border-transparent focus:border-sky-500 outline-none font-bold text-[11px] transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-950 text-white px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all">
            <Plus className="w-3.5 h-3.5 text-sky-400" /> Reserve Unit
          </button>
        </div>
      )}

      {!isInternalModalOnly && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-100">
               <tr className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                 <th className="px-6 py-3">Folio ID / Guest</th>
                 <th className="px-6 py-3">Stay Period</th>
                 <th className="px-6 py-3">Operator</th>
                 <th className="px-6 py-3">Status</th>
                 <th className="px-6 py-3 text-right">Accounting</th>
                 <th className="px-6 py-3 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filteredBookings.map(b => {
                 const customer = state.customers.find(c => c.id === b.customerId);
                 const apartment = state.apartments.find(a => a.id === b.apartmentId);
                 return (
                   <tr key={b.id} className="hover:bg-slate-50 transition-all group text-[11px] font-bold">
                     <td className="px-6 py-3">
                        <p className="font-black text-slate-900">{customer?.name || 'Walk-in'}</p>
                        <p className="text-[8px] text-sky-600 uppercase font-black">U-{apartment?.unitNumber} • {b.platform}</p>
                     </td>
                     <td className="px-6 py-3 text-[10px] text-slate-500 font-black">
                        {b.startDate} <span className="text-slate-300">→</span> {b.endDate}
                     </td>
                     <td className="px-6 py-3 text-[9px] text-slate-400 font-black uppercase">
                        @{b.receptionistName || 'System'}
                     </td>
                     <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          b.status === 'stay' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                          b.status === 'confirmed' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {b.status}
                        </span>
                     </td>
                     <td className="px-6 py-3 text-right">
                        <p className="font-black text-slate-900">{b.totalAmount.toLocaleString()} {b.currency}</p>
                        <p className={`text-[8px] font-black uppercase ${b.totalAmount - b.paidAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                           {b.totalAmount - b.paidAmount > 0 ? `Due: ${(b.totalAmount - b.paidAmount).toLocaleString()}` : 'Settled'}
                        </p>
                     </td>
                     <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-1">
                           <button onClick={() => setShowInvoice(b)} className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Generate Invoice"><ReceiptText className="w-3.5 h-3.5" /></button>
                           <button onClick={() => startEdit(b)} className="p-2 bg-slate-50 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><Edit2 className="w-3 h-3" /></button>
                           <button onClick={() => onDeleteBooking(b.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3 h-3" /></button>
                        </div>
                     </td>
                   </tr>
                 )
               })}
             </tbody>
           </table>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[3000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl border-4 border-slate-950 flex flex-col max-h-[96vh] overflow-hidden no-print">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950 text-white rounded-2xl"><ReceiptText className="w-6 h-6" /></div>
                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Guest Invoice Preview</h3>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={printInvoice} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all">
                       <Printer className="w-4 h-4" /> Print PDF Invoice
                    </button>
                    <button onClick={() => setShowInvoice(null)} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-950"><X className="w-7 h-7" /></button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 bg-white">
                 <div className="invoice-content max-w-3xl mx-auto space-y-12">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b-4 border-slate-950 pb-8">
                       <div>
                          <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">BAHIA HURGHADA<span className="text-sky-500">.</span></h1>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Premium Property Management</p>
                          <div className="mt-6 text-[11px] font-bold text-slate-500 space-y-1">
                             <p>Hurghada, Red Sea, Egypt</p>
                             <p>Phone: +20 123 456 7890</p>
                             <p>Email: admin@bahia-residence.com</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <h2 className="text-6xl font-black text-slate-100 uppercase -mt-4">INVOICE</h2>
                          <div className="mt-4 space-y-1">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Number</p>
                             <p className="text-xl font-black text-slate-950">#{showInvoice.displayId}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Issue Date</p>
                             <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString()}</p>
                          </div>
                       </div>
                    </div>

                    {/* Guest & Stay Details */}
                    <div className="grid grid-cols-2 gap-12">
                       <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Guest Information</p>
                          <h4 className="text-2xl font-black text-slate-950 uppercase">{state.customers.find(c => c.id === showInvoice.customerId)?.name}</h4>
                          <div className="mt-4 space-y-2 text-xs font-bold text-slate-600">
                             <p className="flex items-center gap-2"><Phone className="w-3 h-3 text-emerald-500" /> {state.customers.find(c => c.id === showInvoice.customerId)?.phone}</p>
                             <p className="flex items-center gap-2"><Mail className="w-3 h-3 text-sky-500" /> {state.customers.find(c => c.id === showInvoice.customerId)?.email || 'N/A'}</p>
                             <p className="flex items-center gap-2"><Globe className="w-3 h-3 text-slate-400" /> {state.customers.find(c => c.id === showInvoice.customerId)?.nationality}</p>
                          </div>
                       </div>
                       <div className="p-8 bg-slate-950 text-white rounded-3xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10"><Building className="w-20 h-20" /></div>
                          <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-4">Stay Summary</p>
                          <div className="space-y-4">
                             <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase">Unit Number</p>
                                <p className="text-2xl font-black">U-{state.apartments.find(a => a.id === showInvoice.apartmentId)?.unitNumber}</p>
                             </div>
                             <div className="flex gap-8">
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase">Check-In</p>
                                   <p className="text-sm font-black">{showInvoice.startDate}</p>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase">Check-Out</p>
                                   <p className="text-sm font-black">{showInvoice.endDate}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Charges Breakdown</p>
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4 rounded-tl-xl">Description</th>
                                <th className="px-6 py-4">Quantity / Type</th>
                                <th className="px-6 py-4 text-right rounded-tr-xl">Subtotal ({showInvoice.currency})</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 border border-slate-100">
                             <tr className="text-[12px] font-bold">
                                <td className="px-6 py-5">Core Accommodation Services</td>
                                <td className="px-6 py-5 text-slate-500">
                                   {Math.max(1, Math.ceil((new Date(showInvoice.endDate).getTime() - new Date(showInvoice.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Nights
                                </td>
                                <td className="px-6 py-5 text-right font-black">
                                   {(showInvoice.totalAmount - (showInvoice.extraServices?.reduce((a,c) => a + c.price, 0) || 0) - (showInvoice.services?.reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0) || 0)).toLocaleString()}
                                </td>
                             </tr>
                             {showInvoice.services?.map(sid => {
                                const s = state.services.find(x => x.id === sid);
                                return s ? (
                                   <tr key={s.id} className="text-[11px] font-bold text-slate-600 bg-slate-50/50">
                                      <td className="px-6 py-4">{s.name} (Initial Amenity)</td>
                                      <td className="px-6 py-4 uppercase">Included</td>
                                      <td className="px-6 py-4 text-right font-black">{s.price.toLocaleString()}</td>
                                   </tr>
                                ) : null;
                             })}
                             {showInvoice.extraServices?.map(es => (
                                <tr key={es.id} className="text-[11px] font-bold text-slate-600">
                                   <td className="px-6 py-4">{es.name} (Additional)</td>
                                   <td className="px-6 py-4 uppercase">{es.date}</td>
                                   <td className="px-6 py-4 text-right font-black">{es.price.toLocaleString()}</td>
                                </tr>
                             ))}
                          </tbody>
                          <tfoot>
                             <tr className="bg-slate-50 border-t-2 border-slate-950">
                                <td colSpan={2} className="px-6 py-5 text-right font-black uppercase text-[10px] text-slate-500">Grand Total</td>
                                <td className="px-6 py-5 text-right text-2xl font-black text-slate-950">{showInvoice.totalAmount.toLocaleString()} <span className="text-xs">{showInvoice.currency}</span></td>
                             </tr>
                             <tr className="bg-white">
                                <td colSpan={2} className="px-6 py-3 text-right font-black uppercase text-[9px] text-emerald-600">Amount Settled</td>
                                <td className="px-6 py-3 text-right text-lg font-black text-emerald-600">-{showInvoice.paidAmount.toLocaleString()}</td>
                             </tr>
                             <tr className="bg-slate-950 text-white">
                                <td colSpan={2} className="px-6 py-5 text-right font-black uppercase text-[11px] tracking-widest">Balance Outstanding</td>
                                <td className="px-6 py-5 text-right text-2xl font-black text-rose-400">{(showInvoice.totalAmount - showInvoice.paidAmount).toLocaleString()} {showInvoice.currency}</td>
                             </tr>
                          </tfoot>
                       </table>
                    </div>

                    <div className="flex justify-between items-end pt-12">
                       <div className="max-w-xs text-[10px] font-bold text-slate-400 leading-relaxed">
                          <p className="font-black text-slate-900 uppercase mb-2">Terms & Conditions</p>
                          <p>Thank you for choosing Bahia Hurghada. All services provided are subject to our standard terms of agreement. For any inquiries, please contact our accounting department.</p>
                       </div>
                       <div className="text-center">
                          <div className="w-48 h-1 bg-slate-950 mb-4"></div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Management Authorization</p>
                          <p className="text-sm font-black text-slate-950 mt-1">Bahia OS Terminal</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Hidden Invoice For Print */}
           <div className="hidden print:block fixed inset-0 bg-white p-0">
               <div className="invoice-box">
                  <div className="flex justify-between items-start border-b-4 border-black pb-8">
                      <div>
                        <h1 className="text-4xl font-black text-black tracking-tighter uppercase leading-none">BAHIA HURGHADA.</h1>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-2">Premium Property Management</p>
                        <div className="mt-6 text-[11px] font-bold text-slate-700 space-y-1">
                            <p>Hurghada, Red Sea, Egypt</p>
                            <p>Phone: +20 123 456 7890</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 className="text-5xl font-black text-slate-300 uppercase">INVOICE</h2>
                        <p className="text-xl font-black text-black mt-4">#{showInvoice.displayId}</p>
                        <p className="text-sm font-bold text-slate-600">{new Date().toLocaleDateString()}</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mt-12">
                      <div className="p-6 border border-slate-200">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Guest Profile</p>
                        <h4 className="text-xl font-black text-black uppercase">{state.customers.find(c => c.id === showInvoice.customerId)?.name}</h4>
                        <p className="text-xs font-bold text-slate-700 mt-2">{state.customers.find(c => c.id === showInvoice.customerId)?.phone}</p>
                      </div>
                      <div className="p-6 border border-slate-200">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Stay Record</p>
                        <p className="text-xl font-black text-black">U-{state.apartments.find(a => a.id === showInvoice.apartmentId)?.unitNumber}</p>
                        <p className="text-xs font-bold text-slate-700 mt-2">{showInvoice.startDate} to {showInvoice.endDate}</p>
                      </div>
                  </div>

                  <table className="w-full mt-12 text-sm">
                      <thead>
                        <tr className="border-b-2 border-black font-black uppercase text-[10px]">
                            <th className="text-left py-3">Description</th>
                            <th className="text-right py-3">Amount ({showInvoice.currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="font-bold">
                            <td className="py-4">Stay Accommodation Charge</td>
                            <td className="text-right">{(showInvoice.totalAmount - (showInvoice.extraServices?.reduce((a,c) => a + c.price, 0) || 0) - (showInvoice.services?.reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0) || 0)).toLocaleString()}</td>
                        </tr>
                        {showInvoice.services?.map(sid => {
                            const s = state.services.find(x => x.id === sid);
                            return s ? (
                                <tr key={s.id} className="text-slate-600">
                                  <td className="py-3">{s.name}</td>
                                  <td className="text-right">{s.price.toLocaleString()}</td>
                                </tr>
                            ) : null;
                        })}
                        {showInvoice.extraServices?.map(es => (
                            <tr key={es.id} className="text-slate-600">
                              <td className="py-3">{es.name} ({es.date})</td>
                              <td className="text-right">{es.price.toLocaleString()}</td>
                            </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-black font-black">
                            <td className="py-4 text-right">TOTAL AMOUNT DUE</td>
                            <td className="text-right text-xl">{showInvoice.totalAmount.toLocaleString()}</td>
                        </tr>
                        <tr className="text-emerald-700">
                            <td className="py-2 text-right">AMOUNT PAID</td>
                            <td className="text-right">-{showInvoice.paidAmount.toLocaleString()}</td>
                        </tr>
                        <tr className="font-black text-xl border-t border-black">
                            <td className="py-4 text-right">BALANCE PAYABLE</td>
                            <td className="text-right">{(showInvoice.totalAmount - showInvoice.paidAmount).toLocaleString()} {showInvoice.currency}</td>
                        </tr>
                      </tfoot>
                  </table>
               </div>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl border-2 border-slate-950 flex flex-col max-h-[94vh] overflow-hidden">
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-950 rounded-xl text-white shadow-lg"><ConciergeBell className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950 tracking-tighter uppercase leading-none">{editingBookingId ? 'Modify Folio' : 'New Guest Folio'}</h3>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Responsible: {formData.receptionistName}</p>
                  </div>
               </div>
               <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-950"><X className="w-8 h-8" /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Guest Details */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                     <div className="flex justify-between items-center">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><UserIcon className="w-3 h-3 text-sky-500" /> Guest Identity</h4>
                        <div className="relative group">
                           <Users className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                           <select 
                             className="pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 bg-white font-black text-[9px] uppercase outline-none focus:border-sky-500 transition-all appearance-none cursor-pointer min-w-[150px]"
                             value={formData.customerId}
                             onChange={e => handleGuestSelect(e.target.value)}
                           >
                              <option value="new">New Record</option>
                              {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Full Guest Name</label>
                          <input required className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-xs" value={formData.newCustomer.name} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value }})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Contact Phone</label>
                          <input required className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-xs" value={formData.newCustomer.phone} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, phone: e.target.value }})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Email (Optional)</label>
                          <input className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-xs" type="email" value={formData.newCustomer.email} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, email: e.target.value }})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Nationality</label>
                          <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-xs" value={formData.newCustomer.nationality} onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, nationality: e.target.value }})}>
                            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                     </div>
                   </div>

                   <div className="p-6 bg-white rounded-[2rem] border border-slate-200 space-y-4 shadow-sm">
                     <div className="flex justify-between items-center">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Building className="w-3 h-3 text-sky-500" /> Stay Parameters</h4>
                        {/* Maintenance Toggle */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                           <span className="text-[8px] font-black text-amber-700 uppercase">Set Maintenance</span>
                           <input type="checkbox" checked={formData.status === 'maintenance'} onChange={e => setFormData({...formData, status: e.target.checked ? 'maintenance' : 'confirmed'})} className="w-4 h-4 accent-amber-600" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2">
                           <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Unit Assignment</label>
                           <select required className="w-full p-2.5 rounded-xl border border-slate-100 bg-slate-50 font-black text-xs" value={formData.apartmentId} onChange={e => setFormData({ ...formData, apartmentId: e.target.value })}>
                             <option value="">Choose Room...</option>
                             {state.apartments.map(a => <option key={a.id} value={a.id}>U-{a.unitNumber} ({a.view})</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Check-In Date & Time</label>
                           <div className="flex gap-2">
                              <input type="date" className="flex-1 p-2.5 rounded-xl border border-slate-100 bg-slate-50 font-black text-[11px]" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                              <input type="time" className="w-24 p-2.5 rounded-xl border border-slate-100 bg-slate-50 font-black text-[11px]" value={formData.checkInTime} onChange={e => setFormData({...formData, checkInTime: e.target.value})} />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Check-Out Date & Time</label>
                           <div className="flex gap-2">
                              <input type="date" className="flex-1 p-2.5 rounded-xl border border-slate-100 bg-slate-50 font-black text-[11px]" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                              <input type="time" className="w-24 p-2.5 rounded-xl border border-slate-100 bg-slate-50 font-black text-[11px]" value={formData.checkOutTime} onChange={e => setFormData({...formData, checkOutTime: e.target.value})} />
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* Amenity Selection with Pricing */}
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                     <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Zap className="w-3 h-3 text-sky-500" /> Additional Amenities</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {state.services.map(s => (
                           <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`p-3 rounded-xl border-2 transition-all flex flex-col items-start gap-1 ${formData.selectedServiceIds.includes(s.id) ? 'bg-sky-500 border-sky-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-sky-200'}`}>
                              <div className="w-full flex justify-between items-center">
                                 <span className="text-[10px] font-black uppercase tracking-tight">{s.name}</span>
                                 {formData.selectedServiceIds.includes(s.id) && <CheckCircle className="w-3 h-3" />}
                              </div>
                              <span className={`text-[9px] font-black ${formData.selectedServiceIds.includes(s.id) ? 'text-white/70' : 'text-emerald-600'}`}>+{s.price} EGP</span>
                           </button>
                        ))}
                     </div>
                   </div>
                </div>

                {/* Accounting & Folio Summary */}
                <div className="space-y-6">
                   <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-sky-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><CreditCard className="w-24 h-24" /></div>
                      <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1">Folio Grand Total</p>
                      <h2 className="text-4xl font-black tracking-tighter">{finance.total.toLocaleString()} <span className="text-xs opacity-30 uppercase">{formData.currency}</span></h2>
                      
                      <div className="mt-6 space-y-2 pt-4 border-t border-white/10 relative z-10">
                         <div className="flex justify-between text-[9px] font-black uppercase opacity-50">
                            <span>Stay Cost ({finance.nights} N)</span>
                            <span>{finance.total - finance.servicesCost} {formData.currency}</span>
                         </div>
                         <div className="flex justify-between text-[9px] font-black uppercase opacity-50">
                            <span>Amenities</span>
                            <span>{finance.servicesCost} {formData.currency}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-black uppercase text-rose-400 mt-2">
                            <span>Current Balance</span>
                            <span>{finance.remaining.toLocaleString()} {formData.currency}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-6 relative z-10">
                         <select className="bg-white/5 border border-white/10 p-2.5 rounded-xl font-black text-[10px] outline-none cursor-pointer" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                           {CURRENCIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                         </select>
                         <select className="bg-white/5 border border-white/10 p-2.5 rounded-xl font-black text-[10px] outline-none cursor-pointer" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                           {PAYMENT_METHODS.map(m => <option key={m} value={m} className="text-slate-900">{m}</option>)}
                         </select>
                      </div>

                      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl relative z-10">
                         <label className="text-[9px] font-black text-emerald-400 uppercase block mb-1">Manual Payment Input</label>
                         <input type="number" className="w-full bg-transparent border-none p-0 text-white font-black text-3xl outline-none placeholder:text-emerald-900/50" placeholder="0.00" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} />
                      </div>
                   </div>

                   {/* Commisions & Channel Tracking */}
                   <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center justify-between"><span className="flex items-center gap-1"><Percent className="w-3 h-3 text-rose-500" /> Sales Commission</span> <span className="text-rose-600 font-black">{finance.commissionCalculated} {formData.currency}</span></label>
                        <div className="flex gap-2">
                           <input type="number" placeholder="%" className="w-20 p-2.5 rounded-xl border border-slate-200 bg-white font-black text-xs text-rose-600" value={formData.commissionRate || ''} onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})} />
                           <div className="flex-1 p-2.5 rounded-xl border border-slate-100 bg-slate-50 font-black text-xs text-slate-400 flex items-center justify-center">Auto-calculated</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Current Folio Status</label>
                        <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-[10px] uppercase" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}>
                          <option value="confirmed">Confirmed</option>
                          <option value="stay">Active Stay</option>
                          <option value="checked_out">Closed / Out</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Booking Channel</label>
                        <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-[10px]" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                           {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em] flex items-center gap-2"><StickyNote className="w-3 h-3" /> Internal Folio Notes</label>
                <textarea rows={2} className="w-full p-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 font-bold text-xs outline-none focus:border-sky-500 transition-all" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Room preferences, breakfast notes, etc..." />
              </div>

              <div className="flex gap-4">
                 <button onClick={closeModal} type="button" className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                 <button type="submit" className="flex-[2] py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-sky-500 transition-all border-b-4 border-slate-900">Finalize Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
