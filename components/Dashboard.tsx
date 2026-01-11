
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users as UsersIcon, CalendarCheck, Banknote, Sparkles, Loader2, Clock, Zap, Plus, X, ConciergeBell, Eye, ShieldCheck, ArrowUpRight, Building2, CheckCircle, CreditCard, DollarSign, UserPlus, ShoppingCart, UserCheck, ArrowRight, ClipboardPlus, Calendar, ArrowDownRight, MoveRight, History
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
    state.bookings.forEach(b => {
      if (b.status !== 'cancelled' && b.status !== 'maintenance') {
        if (b.currency === 'USD') usd += b.paidAmount;
        else egp += b.paidAmount;
      }
    });
    return { egp, usd };
  }, [state.bookings]);

  // Next 48h Actions Engine
  const nextActions = useMemo(() => {
    const now = new Date();
    const future48h = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    const todayStr = now.toISOString().split('T')[0];
    const futureStr = future48h.toISOString().split('T')[0];

    const arrivals = state.bookings.filter(b => b.status === 'confirmed' && b.startDate >= todayStr && b.startDate <= futureStr);
    const departures = state.bookings.filter(b => b.status === 'stay' && b.endDate >= todayStr && b.endDate <= futureStr);

    return { arrivals, departures };
  }, [state.bookings]);

  const stats = [
    { label: 'EGP Collected', value: `${totals.egp.toLocaleString()}`, icon: Banknote, bg: 'bg-slate-950', target: 'reports' },
    { label: 'USD Collected', value: `${totals.usd.toLocaleString()}`, icon: DollarSign, bg: 'bg-sky-500', target: 'reports' },
    { label: 'Occupancy', value: `${state.bookings.filter(b => b.status === 'stay').length}/${state.apartments.length}`, icon: TrendingUp, bg: 'bg-white', target: 'calendar' },
    { label: 'Guests', value: state.customers.length, icon: UsersIcon, bg: 'bg-white', target: 'customers' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Operations Hub</h2>
          <p className="text-slate-400 mt-1 font-bold text-[9px] uppercase tracking-[0.3em]">Bahia Hurghada Real-time Data</p>
        </div>
        <button onClick={async () => { setIsLoadingSummary(true); setSmartSummary(await getSmartSummary(state)); setIsLoadingSummary(false); }} disabled={isLoadingSummary} className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] shadow-sm hover:shadow-md transition-all border border-slate-200 uppercase tracking-widest">
          {isLoadingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-sky-500" />}
          AI Insights
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <button key={i} onClick={() => onTabChange?.(stat.target)} className={`${stat.bg} p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:translate-y-[-2px] transition-all text-left relative overflow-hidden`}>
            <p className={`text-[8px] font-black uppercase tracking-widest ${stat.bg === 'bg-white' ? 'text-slate-400' : 'text-white/60'}`}>{stat.label}</p>
            <p className={`text-xl font-black mt-1 tracking-tighter ${stat.bg === 'bg-white' ? 'text-slate-900' : 'text-white'}`}>{stat.value}</p>
            <div className={`absolute -right-2 -bottom-2 opacity-5 ${stat.bg === 'bg-white' ? 'text-slate-900' : 'text-white'}`}>
              <stat.icon className="w-16 h-16" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next 48h Actions Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2 tracking-tighter"><Calendar className="w-4 h-4 text-sky-500" /> Next 48h Actions</h3>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Arrivals & Departures</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Arrivals */}
                <div className="space-y-3">
                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">Expected Arrivals ({nextActions.arrivals.length})</p>
                   <div className="space-y-2">
                      {nextActions.arrivals.map(b => (
                         <div key={b.id} onClick={() => onOpenDetails(b.id)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 cursor-pointer border border-transparent hover:border-emerald-100 transition-all">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm font-black text-[10px]">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-xs font-black truncate">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold">{b.startDate}</p>
                               </div>
                            </div>
                            <MoveRight className="w-3 h-3 text-emerald-400" />
                         </div>
                      ))}
                      {nextActions.arrivals.length === 0 && <p className="text-[9px] font-bold text-slate-300 uppercase py-4">No arrivals planned</p>}
                   </div>
                </div>

                {/* Departures */}
                <div className="space-y-3">
                   <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg w-fit">Expected Departures ({nextActions.departures.length})</p>
                   <div className="space-y-2">
                      {nextActions.departures.map(b => (
                         <div key={b.id} onClick={() => onOpenDetails(b.id)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-rose-50 cursor-pointer border border-transparent hover:border-rose-100 transition-all">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-600 shadow-sm font-black text-[10px]">U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</div>
                               <div className="min-w-0">
                                  <p className="text-xs font-black truncate">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold">{b.endDate}</p>
                               </div>
                            </div>
                            <ArrowDownRight className="w-3 h-3 text-rose-400" />
                         </div>
                      ))}
                      {nextActions.departures.length === 0 && <p className="text-[9px] font-bold text-slate-300 uppercase py-4">No departures planned</p>}
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between group">
             <div>
                <h3 className="text-white font-black text-lg tracking-tighter uppercase leading-none">Expand Inventory</h3>
                <p className="text-white/40 text-[9px] font-bold uppercase mt-1">Start a new reservation flow on the timeline</p>
             </div>
             <button onClick={() => onTabChange?.('calendar')} className="p-4 bg-sky-500 text-white rounded-2xl hover:bg-white hover:text-sky-500 transition-all shadow-lg group-hover:scale-110">
                <Plus className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit">
          <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-tighter flex items-center gap-2">
            {/* Added missing History import from lucide-react */}
            <History className="w-4 h-4 text-slate-400" /> System Feed
          </h3>
          <div className="space-y-4">
            {state.bookings.slice(-5).reverse().map((b, i) => (
              <div key={i} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0 cursor-pointer group" onClick={() => onOpenDetails(b.id)}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${b.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white'}`}>
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate group-hover:text-sky-500 transition-colors">{state.customers.find(c => c.id === b.customerId)?.name || 'New Guest'}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Unit {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber} • {b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {smartSummary && (
        <div className="bg-sky-50 p-8 rounded-[2rem] border border-sky-100 shadow-sm animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-sky-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase">Strategic Insight Report</h3>
          </div>
          <div className="text-[11px] text-slate-800 font-bold whitespace-pre-wrap leading-relaxed">
            {smartSummary}
          </div>
          <button onClick={() => setSmartSummary(null)} className="mt-6 text-sky-600 font-black uppercase text-[9px] tracking-widest hover:underline">Dismiss Report</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
