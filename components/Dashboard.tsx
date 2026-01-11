
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users as UsersIcon, Banknote, Sparkles, Loader2, Clock, Zap, Plus, X, ConciergeBell, Eye, ArrowUpRight, Building2, CheckCircle, CreditCard, DollarSign, UserCheck, ArrowRight, History, Percent, LayoutGrid, Activity, Wallet, BellRing, CheckCircle2, MapPin, User
} from 'lucide-react';
import { AppState, Booking, BookingStatus, ExtraService } from '../types';
import { getSmartSummary } from '../services/geminiService';
import { PLATFORMS, PAYMENT_METHODS } from '../constants';

interface DashboardProps {
  state: AppState;
  onAddService: (bookingId: string, serviceId: string, paymentMethod: string, isPaid: boolean) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onOpenDetails: (id: string) => void;
  onTabChange?: (tab: string) => void;
  onQuickSettle?: (id: string) => void;
  onFulfillService?: (bookingId: string, serviceId: string, isExtra: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAddService, onUpdateBooking, onOpenDetails, onTabChange, onQuickSettle, onFulfillService }) => {
  const [smartSummary, setSmartSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [serviceModal, setServiceModal] = useState<{ open: boolean, bookingId: string }>({ open: false, bookingId: '' });
  const [detailModal, setDetailModal] = useState<{ open: boolean, booking: Booking | null }>({ open: false, booking: null });
  const [newService, setNewService] = useState({ serviceId: '', paymentMethod: 'Cash', isPaid: true });

  const totals = useMemo(() => {
    let egp = 0;
    let usd = 0;
    state.bookings.forEach(b => {
      if (b.status !== 'cancelled' && b.status !== 'maintenance') {
        if (b.currency === 'USD') usd += b.paidAmount;
        else egp += b.paidAmount;
      }
    });
    return { egp, usd };
  }, [state.bookings]);

  const nextActions = useMemo(() => {
    const now = new Date();
    const future48h = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    const todayStr = now.toISOString().split('T')[0];
    const futureStr = future48h.toISOString().split('T')[0];

    const arrivals = state.bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.startDate >= todayStr && b.startDate <= futureStr);
    return { arrivals };
  }, [state.bookings]);

  const serviceAlerts = useMemo(() => {
    return state.bookings.filter(b => {
      if (b.status !== 'stay' && b.status !== 'confirmed') return false;
      
      const hasUnfulfilledInitial = b.services.some(sid => !(b.fulfilledServices || []).includes(sid));
      const hasUnfulfilledExtra = (b.extraServices || []).some(es => !es.isFulfilled);
      
      return hasUnfulfilledInitial || hasUnfulfilledExtra;
    });
  }, [state.bookings]);

  const stats = [
    { label: 'EGP Liquidity', value: `${totals.egp.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'USD Liquidity', value: `${totals.usd.toLocaleString()}`, icon: DollarSign, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Active Keys', value: state.bookings.filter(b => b.status === 'stay').length, icon: UserCheck, color: 'text-slate-900', bg: 'bg-slate-100' },
    { label: 'Units Ready', value: state.apartments.length - state.bookings.filter(b => b.status === 'stay' || b.status === 'maintenance').length, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const currentStayBookings = state.bookings.filter(b => b.status === 'stay');

  const handleMarkAllFulfilled = () => {
    if (!detailModal.booking || !onFulfillService) return;
    const b = detailModal.booking;
    
    // Fulfill all initial
    b.services.forEach(sid => {
      if (!(b.fulfilledServices || []).includes(sid)) {
        onFulfillService(b.id, sid, false);
      }
    });
    
    // Fulfill all extra
    (b.extraServices || []).forEach(es => {
      if (!es.isFulfilled) {
        onFulfillService(b.id, es.id, true);
      }
    });
    
    setDetailModal({ open: false, booking: null });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
                Bahia Intelligence Terminal v14.1 
                <span className="flex items-center gap-1 text-emerald-600 border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 rounded text-[7px]"><Activity className="w-2 h-2" /> Operations & Fulfillment Focused</span>
              </p>
           </div>
           <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Command <span className="text-sky-600">Center</span></h2>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button onClick={async () => { setIsLoadingSummary(true); setSmartSummary(await getSmartSummary(state)); setIsLoadingSummary(false); }} disabled={isLoadingSummary} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-950 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-sky-600 transition-all uppercase tracking-widest">
            {isLoadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Analysis
          </button>
          <button onClick={() => onTabChange?.('calendar')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-sky-600 transition-all uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5" /> Book Now
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-sky-500 transition-all">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`text-2xl font-black mt-1 tracking-tighter ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Service Alerts */}
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-500 text-white rounded-lg shadow-sm"><BellRing className="w-4 h-4" /></div>
                   <h3 className="text-xs font-black uppercase tracking-tighter text-amber-900">Amenity Fulfillment Queue</h3>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {serviceAlerts.length > 0 ? serviceAlerts.slice(0, 4).map(b => (
                   <div key={b.id} onClick={() => setDetailModal({ open: true, booking: b })} className="bg-white p-4 rounded-2xl border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-all group">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-[10px] border border-amber-100">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                         <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-900 truncate uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                            <p className="text-[8px] font-bold text-amber-600 uppercase">Manage Service Delivery</p>
                         </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-300 group-hover:text-amber-500" />
                   </div>
                )) : (
                  <div className="col-span-2 py-4 text-center opacity-30 font-black text-[8px] uppercase tracking-widest">No pending service requests</div>
                )}
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-sky-100 rounded-lg text-sky-600"><LayoutGrid className="w-4 h-4" /></div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Operation Hotlist</h3>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Arrivals */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Expected Arrivals ({nextActions.arrivals.length})
                   </p>
                   <div className="space-y-2">
                      {nextActions.arrivals.map(b => (
                         <div key={b.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-transparent hover:border-emerald-200 transition-all hover:bg-white group">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onOpenDetails(b.id)}>
                               <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm font-black text-[11px]">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-black text-slate-900 truncate uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className={`text-[8px] font-bold uppercase ${b.totalAmount - b.paidAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>Due: {b.totalAmount - b.paidAmount}</p>
                               </div>
                            </div>
                            {b.totalAmount - b.paidAmount > 0 && (
                                <button onClick={() => onQuickSettle?.(b.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                    <Wallet className="w-3.5 h-3.5" />
                                </button>
                            )}
                         </div>
                      ))}
                   </div>
                </div>

                {/* In-House */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> In-House Guests ({currentStayBookings.length})
                   </p>
                   <div className="space-y-2">
                      {currentStayBookings.map(b => (
                         <div key={b.id} className="flex items-center justify-between p-3.5 bg-sky-50 rounded-2xl border border-sky-100 group">
                            <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => onOpenDetails(b.id)}>
                               <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm font-black text-[11px]">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-black text-slate-900 truncate uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className={`text-[8px] font-bold uppercase ${b.totalAmount - b.paidAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>Bal: {b.totalAmount - b.paidAmount}</p>
                               </div>
                            </div>
                            <button onClick={() => setServiceModal({ open: true, bookingId: b.id })} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all shadow-sm">
                                <Zap className="w-3.5 h-3.5" />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* System Pulse */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-950 rounded-lg text-white"><History className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-tighter">System Pulse</h3>
            </div>
            <div className="space-y-5">
              {state.bookings.slice(-6).reverse().map((b, i) => (
                <div key={i} className="flex gap-4 cursor-pointer group" onClick={() => onOpenDetails(b.id)}>
                  <div className={`w-1 h-10 rounded-full shrink-0 ${b.status === 'cancelled' ? 'bg-rose-500' : 'bg-sky-500'}`}></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black truncate uppercase group-hover:text-sky-400 transition-colors">{state.customers.find(c => c.id === b.customerId)?.name || 'Guest'}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Room {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber} • {b.platform}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Amenity Detail Modal - FAST VIEW & ACTION */}
      {detailModal.open && detailModal.booking && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 border-2 border-slate-950">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 text-amber-600">
                   <BellRing className="w-8 h-8" />
                   <h3 className="text-2xl font-black tracking-tighter uppercase">Amenity Delivery</h3>
                </div>
                <button onClick={() => setDetailModal({ open: false, booking: null })} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-900"><X className="w-8 h-8" /></button>
             </div>
             
             <div className="space-y-6">
                <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                   <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg">
                      <span className="text-[9px] font-black uppercase opacity-40">Unit</span>
                      <span className="text-2xl font-black">{state.apartments.find(a => a.id === detailModal.booking!.apartmentId)?.unitNumber}</span>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In-House Guest</p>
                      <h4 className="text-xl font-black text-slate-900 uppercase truncate">{state.customers.find(c => c.id === detailModal.booking!.customerId)?.name}</h4>
                   </div>
                </div>

                <div className="space-y-3">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pending Fulfillment</p>
                   <div className="bg-white p-2 rounded-2xl border border-slate-100 space-y-2">
                      {detailModal.booking.services.filter(sid => !(detailModal.booking!.fulfilledServices || []).includes(sid)).map(sid => {
                         const s = state.services.find(x => x.id === sid);
                         return s ? (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-all group">
                               <span className="font-black text-slate-900 uppercase text-xs">{s.name}</span>
                               <button onClick={() => onFulfillService?.(detailModal.booking!.id, s.id, false)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                                  <CheckCircle2 className="w-4 h-4" />
                               </button>
                            </div>
                         ) : null;
                      })}
                      {(detailModal.booking.extraServices || []).filter(es => !es.isFulfilled).map(es => (
                         <div key={es.id} className="flex items-center justify-between p-3 bg-sky-50 rounded-xl hover:bg-emerald-50 transition-all group">
                            <span className="font-black text-sky-950 uppercase text-xs">{es.name}</span>
                            <button onClick={() => onFulfillService?.(detailModal.booking!.id, es.id, true)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                               <CheckCircle2 className="w-4 h-4" />
                            </button>
                         </div>
                      ))}
                      {detailModal.booking.services.every(sid => (detailModal.booking!.fulfilledServices || []).includes(sid)) && 
                       (detailModal.booking.extraServices || []).every(es => es.isFulfilled) && (
                         <div className="py-8 text-center opacity-30 font-black text-[10px] uppercase">All services fulfilled</div>
                       )}
                   </div>
                </div>

                <button onClick={handleMarkAllFulfilled} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-3">
                   <CheckCircle2 className="w-5 h-5" /> Mark All as Completed
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Service Add Modal */}
      {serviceModal.open && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border-2 border-slate-950">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <Zap className="w-6 h-6 text-sky-500" />
                   <h3 className="text-xl font-black text-slate-950 tracking-tighter uppercase">Room Service</h3>
                </div>
                <button onClick={() => setServiceModal({ open: false, bookingId: '' })} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
             </div>
             <div className="space-y-4">
                <select className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-xs" value={newService.serviceId} onChange={e => setNewService({...newService, serviceId: e.target.value})}>
                   <option value="">Select Service...</option>
                   {state.services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} EGP)</option>)}
                </select>
                <button onClick={() => { 
                   if(!newService.serviceId) return;
                   onAddService(serviceModal.bookingId, newService.serviceId, newService.paymentMethod, newService.isPaid);
                   setServiceModal({ open: false, bookingId: '' });
                }} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-sky-600 transition-all">Add to Folio</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
