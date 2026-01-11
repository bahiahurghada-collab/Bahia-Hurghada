
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users as UsersIcon, CalendarCheck, Banknote, Sparkles, Loader2, Clock, Zap, Plus, X, ConciergeBell, Eye, ShieldCheck, ArrowUpRight, Building2, CheckCircle, CreditCard, DollarSign, UserPlus, ShoppingCart, UserCheck, ArrowRight, ClipboardPlus, Calendar, ArrowDownRight, MoveRight, History, Percent, LayoutGrid, Globe, Smartphone, MessageCircle
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
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAddService, onUpdateBooking, onOpenDetails, onTabChange }) => {
  const [smartSummary, setSmartSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [serviceModal, setServiceModal] = useState<{ open: boolean, bookingId: string }>({ open: false, bookingId: '' });
  const [newService, setNewService] = useState({ serviceId: '', paymentMethod: 'Cash', isPaid: true });

  const totals = useMemo(() => {
    let egp = 0;
    let usd = 0;
    let comm = 0;
    state.bookings.forEach(b => {
      if (b.status !== 'cancelled' && b.status !== 'maintenance') {
        if (b.currency === 'USD') usd += b.paidAmount;
        else egp += b.paidAmount;
        comm += b.commissionAmount;
      }
    });
    return { egp, usd, comm };
  }, [state.bookings]);

  const nextActions = useMemo(() => {
    const now = new Date();
    const future48h = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    const todayStr = now.toISOString().split('T')[0];
    const futureStr = future48h.toISOString().split('T')[0];

    const arrivals = state.bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.startDate >= todayStr && b.startDate <= futureStr);
    const departures = state.bookings.filter(b => b.status === 'stay' && b.endDate >= todayStr && b.endDate <= futureStr);

    return { arrivals, departures };
  }, [state.bookings]);

  const channelStats = useMemo(() => {
    return PLATFORMS.map(platform => {
      const active = state.bookings.filter(b => b.platform === platform && b.status === 'stay').length;
      const upcoming = state.bookings.filter(b => b.platform === platform && b.status === 'confirmed').length;
      return { platform, active, upcoming };
    }).filter(p => p.active > 0 || p.upcoming > 0 || p.platform === 'Direct');
  }, [state.bookings]);

  const stats = [
    { label: 'EGP Collected', value: `${totals.egp.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'USD Collected', value: `${totals.usd.toLocaleString()}`, icon: DollarSign, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Commission Due', value: `${totals.comm.toLocaleString()}`, icon: Percent, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Current Guests', value: state.bookings.filter(b => b.status === 'stay').length, icon: UserCheck, color: 'text-slate-900', bg: 'bg-slate-100' },
  ];

  const currentStayBookings = state.bookings.filter(b => b.status === 'stay');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">Bahia Hurghada Management System v10.0</p>
           </div>
           <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Operations <span className="text-sky-600">Overview</span></h2>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button onClick={async () => { setIsLoadingSummary(true); setSmartSummary(await getSmartSummary(state)); setIsLoadingSummary(false); }} disabled={isLoadingSummary} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-950 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-sky-600 transition-all uppercase tracking-widest">
            {isLoadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Business Intel
          </button>
          <button onClick={() => onTabChange?.('calendar')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-sky-600 transition-all uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5" /> New Reservation
          </button>
        </div>
      </div>

      {/* Metric Scoreboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-500 transition-all">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`text-2xl font-black mt-1 tracking-tighter ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Analytics & Platform Performance */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 p-6 rounded-[2.5rem] shadow-xl text-white">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/10 rounded-lg text-sky-400"><Globe className="w-4 h-4" /></div>
                   <h3 className="text-sm font-black uppercase tracking-tighter">Channel Performance Analytics</h3>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channelStats.map((c, i) => (
                   <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">{c.platform}</span>
                        <Globe className="w-3.5 h-3.5 text-white/20" />
                      </div>
                      <div className="flex items-end justify-between">
                         <div className="space-y-1">
                            <p className="text-xl font-black leading-none">{c.active + c.upcoming}</p>
                            <p className="text-[7px] font-black text-white/30 uppercase">Total Folio</p>
                         </div>
                         <div className="flex gap-2">
                            <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md text-center min-w-[32px]">
                               <p className="text-[10px] font-black leading-none">{c.active}</p>
                               <p className="text-[6px] font-black uppercase mt-0.5">Act</p>
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Operational Timeline Grid */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-sky-100 rounded-lg text-sky-600"><LayoutGrid className="w-4 h-4" /></div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Live Operations (48h)</h3>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Expected Arrivals */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Expected Arrivals ({nextActions.arrivals.length})
                   </p>
                   <div className="space-y-2">
                      {nextActions.arrivals.map(b => (
                         <div key={b.id} onClick={() => onOpenDetails(b.id)} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-transparent hover:border-emerald-200 cursor-pointer transition-all hover:bg-white group">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm font-black text-[11px]">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-black text-slate-900 truncate uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase">{b.startDate} @ {b.checkInTime || '14:00'}</p>
                               </div>
                            </div>
                            <MoveRight className="w-4 h-4 text-emerald-400" />
                         </div>
                      ))}
                   </div>
                </div>

                {/* In-House Guest Management (Quick Services) */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Current In-House ({currentStayBookings.length})
                   </p>
                   <div className="space-y-2">
                      {currentStayBookings.map(b => (
                         <div key={b.id} className="flex items-center justify-between p-3.5 bg-sky-50 rounded-2xl border border-sky-100 group">
                            <div className="flex items-center gap-3 min-w-0">
                               <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm font-black text-[11px]">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-black text-slate-900 truncate uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className="text-[8px] text-sky-500 font-bold uppercase">Balance: {b.totalAmount - b.paidAmount} {b.currency}</p>
                               </div>
                            </div>
                            <button onClick={() => setServiceModal({ open: true, bookingId: b.id })} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all shadow-sm">
                               <Zap className="w-3.5 h-3.5" />
                            </button>
                         </div>
                      ))}
                      {currentStayBookings.length === 0 && <div className="py-10 text-center opacity-20 font-black text-[10px] uppercase tracking-widest">No guests in-house</div>}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Real-time System Feed */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-950 rounded-lg text-white"><History className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-tighter">System Pulse</h3>
            </div>
            <div className="space-y-5">
              {state.bookings.slice(-8).reverse().map((b, i) => (
                <div key={i} className="flex gap-4 cursor-pointer group" onClick={() => onOpenDetails(b.id)}>
                  <div className={`w-1 h-10 rounded-full shrink-0 ${b.status === 'cancelled' ? 'bg-rose-500' : 'bg-sky-500'}`}></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black truncate uppercase group-hover:text-sky-400 transition-colors">{state.customers.find(c => c.id === b.customerId)?.name || 'Guest'}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Unit {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber} • {b.platform}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Service Modal */}
      {serviceModal.open && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border-2 border-slate-950 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <Zap className="w-6 h-6 text-sky-500" />
                   <h3 className="text-xl font-black text-slate-950 tracking-tighter uppercase">Room Service</h3>
                </div>
                <button onClick={() => setServiceModal({ open: false, bookingId: '' })} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-6 h-6" /></button>
             </div>
             
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Choose Service</label>
                   <select className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-xs outline-none" value={newService.serviceId} onChange={e => setNewService({...newService, serviceId: e.target.value})}>
                      <option value="">Select Service...</option>
                      {state.services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} EGP)</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Collection</label>
                     <select className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-xs outline-none" value={newService.paymentMethod} onChange={e => setNewService({...newService, paymentMethod: e.target.value})}>
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        <option value="Room Charge">Room Charge</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
                     <button onClick={() => setNewService({...newService, isPaid: !newService.isPaid})} className={`w-full p-4 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${newService.isPaid ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                        {newService.isPaid ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {newService.isPaid ? 'PAID' : 'PENDING'}
                     </button>
                  </div>
                </div>

                <button onClick={() => { 
                   if(!newService.serviceId) return;
                   onAddService(serviceModal.bookingId, newService.serviceId, newService.paymentMethod, newService.isPaid);
                   setServiceModal({ open: false, bookingId: '' });
                }} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl mt-4">
                   Deliver & Add to Folio
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
