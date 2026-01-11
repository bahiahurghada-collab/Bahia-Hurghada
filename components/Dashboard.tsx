
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users as UsersIcon, CalendarCheck, Banknote, Sparkles, Loader2, Clock, Zap, Plus, X, ConciergeBell, Eye, ShieldCheck, ArrowUpRight, Building2, CheckCircle, CreditCard, DollarSign, UserPlus, ShoppingCart, UserCheck, ArrowRight, ClipboardPlus, Calendar, ArrowDownRight, MoveRight, History, Percent, LayoutGrid
} from 'lucide-react';
import { AppState, Booking, BookingStatus, ExtraService } from '../types';
import { getSmartSummary } from '../services/geminiService';
import { PAYMENT_METHODS } from '../constants';

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

  const stats = [
    { label: 'EGP Folio', value: `${totals.egp.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'USD Folio', value: `${totals.usd.toLocaleString()}`, icon: DollarSign, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Staff Payroll', value: `${totals.comm.toLocaleString()}`, icon: Percent, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Active Guests', value: state.bookings.filter(b => b.status === 'stay').length, icon: UserCheck, color: 'text-slate-900', bg: 'bg-slate-100' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">Bahia Hurghada Management System v7.0</p>
           </div>
           <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Operations <span className="text-sky-600">Overview</span></h2>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button onClick={async () => { setIsLoadingSummary(true); setSmartSummary(await getSmartSummary(state)); setIsLoadingSummary(false); }} disabled={isLoadingSummary} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-950 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-sky-600 transition-all uppercase tracking-widest">
            {isLoadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Intel
          </button>
          <button onClick={() => onTabChange?.('calendar')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-sky-600 transition-all uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5" /> Quick Book
          </button>
        </div>
      </div>

      {/* Main Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-500 transition-all">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`text-2xl font-black mt-1 tracking-tighter ${stat.color}`}>{stat.value}</p>
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <stat.icon className="w-12 h-12" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next 48h Timeline Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-sky-100 rounded-lg text-sky-600"><LayoutGrid className="w-4 h-4" /></div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Operational Timeline (48h)</h3>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="text-[8px] font-black text-slate-400 uppercase">In</span></div>
                   <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span><span className="text-[8px] font-black text-slate-400 uppercase">Out</span></div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Expected Arrivals */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Expected Check-In</p>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black">{nextActions.arrivals.length} Units</span>
                   </div>
                   <div className="space-y-2">
                      {nextActions.arrivals.map(b => (
                         <div key={b.id} onClick={() => onOpenDetails(b.id)} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-transparent hover:border-emerald-200 cursor-pointer transition-all hover:bg-white group">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm font-black text-[11px] group-hover:bg-emerald-600 group-hover:text-white transition-colors">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-black text-slate-900 truncate uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase">{b.startDate} @ {b.checkInTime || '14:00'}</p>
                               </div>
                            </div>
                            <MoveRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                         </div>
                      ))}
                      {nextActions.arrivals.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <CalendarCheck className="w-8 h-8 mb-2" />
                            <p className="text-[9px] font-black uppercase">No upcoming check-ins</p>
                         </div>
                      )}
                   </div>
                </div>

                {/* Expected Departures */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Expected Check-Out</p>
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[8px] font-black">{nextActions.departures.length} Units</span>
                   </div>
                   <div className="space-y-2">
                      {nextActions.departures.map(b => (
                         <div key={b.id} onClick={() => onOpenDetails(b.id)} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-transparent hover:border-rose-200 cursor-pointer transition-all hover:bg-white group">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-600 shadow-sm font-black text-[11px] group-hover:bg-rose-600 group-hover:text-white transition-colors">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-black text-slate-900 truncate uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase">{b.endDate} @ {b.checkOutTime || '12:00'}</p>
                               </div>
                            </div>
                            <ArrowDownRight className="w-4 h-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-all" />
                         </div>
                      ))}
                      {nextActions.departures.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <Clock className="w-8 h-8 mb-2" />
                            <p className="text-[9px] font-black uppercase">No upcoming check-outs</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => onTabChange?.('apartments')} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between group hover:bg-slate-950 transition-all">
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-400 group-hover:text-sky-400 uppercase tracking-widest">Inventory</p>
                   <h4 className="text-lg font-black text-slate-900 group-hover:text-white tracking-tighter uppercase">Room Units</h4>
                </div>
                <Building2 className="w-8 h-8 text-slate-200 group-hover:text-white/20" />
             </button>
             <button onClick={() => onTabChange?.('commissions')} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between group hover:bg-sky-500 transition-all">
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-widest">Payroll</p>
                   <h4 className="text-lg font-black text-slate-900 group-hover:text-white tracking-tighter uppercase">Sales List</h4>
                </div>
                <Percent className="w-8 h-8 text-slate-200 group-hover:text-white/20" />
             </button>
          </div>
        </div>

        {/* Real-time Feed & AI */}
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-[2.5rem] shadow-xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg text-sky-400"><History className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase tracking-tighter">Recent Activities</h3>
            </div>
            <div className="space-y-5">
              {state.bookings.slice(-5).reverse().map((b, i) => (
                <div key={i} className="flex gap-4 cursor-pointer group" onClick={() => onOpenDetails(b.id)}>
                  <div className={`w-1 h-10 rounded-full shrink-0 ${b.status === 'cancelled' ? 'bg-rose-500' : 'bg-sky-500'}`}></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black truncate uppercase group-hover:text-sky-400 transition-colors">{state.customers.find(c => c.id === b.customerId)?.name || 'Walk-in'}</p>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">Unit {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber} • {b.platform}</p>
                    <div className="flex items-center justify-between mt-1">
                       <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${b.status === 'stay' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}`}>{b.status}</span>
                       <span className="text-[8px] font-black text-sky-400">{b.paidAmount} {b.currency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {smartSummary && (
             <div className="bg-sky-50 p-6 rounded-[2.5rem] border border-sky-100 shadow-sm animate-in slide-in-from-right-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-12 h-12 text-sky-600" /></div>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <h3 className="text-[10px] font-black text-sky-700 uppercase tracking-widest">Business Intel Report</h3>
                </div>
                <div className="text-[11px] text-slate-800 font-bold leading-relaxed relative z-10 whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {smartSummary}
                </div>
                <button onClick={() => setSmartSummary(null)} className="mt-4 text-[9px] font-black text-slate-400 hover:text-slate-950 transition-all uppercase tracking-widest underline">Close Intel</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
