
import React, { useMemo, useState, useEffect } from 'react';
import { Building2, ConciergeBell, Users, Wallet, TrendingUp, ChevronRight, Zap, Sparkles, Loader2 } from 'lucide-react';
import { AppState } from '../types';
import { getSmartSummary } from '../services/geminiService';

interface DashboardProps {
  state: AppState;
  onAddService: any;
  onUpdateBooking: any;
  onOpenDetails: (id: string) => void;
  onTabChange?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onOpenDetails }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const stats = useMemo(() => {
    const activeBookings = state.bookings.filter(b => b.status === 'stay');
    const totalRev = state.bookings.reduce((acc, b) => acc + (b.currency === 'USD' ? b.paidAmount * state.currentExchangeRate : b.paidAmount), 0);
    return {
      active: activeBookings.length,
      revenue: totalRev,
      guests: state.customers.length,
      units: state.apartments.length
    };
  }, [state]);

  const recentBookings = useMemo(() => {
    return [...state.bookings].sort((a,b) => b.bookingDate.localeCompare(a.bookingDate)).slice(0, 5);
  }, [state.bookings]);

  useEffect(() => {
    const fetchAi = async () => {
      if (state.bookings.length === 0) return;
      setIsAiLoading(true);
      try {
        const insight = await getSmartSummary(state);
        setAiInsight(insight);
      } catch (e) {
        setAiInsight("Unable to reach AI advisor at this moment.");
      } finally {
        setIsAiLoading(false);
      }
    };
    fetchAi();
  }, [state.bookings.length, state.expenses.length]);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-sky-500 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-20 h-20" />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Gross Revenue (EGP)</p>
          <h3 className="text-4xl font-black text-slate-950 tracking-tighter">{stats.revenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Unit Occupancy</p>
          <h3 className="text-4xl font-black text-slate-950 tracking-tighter">{stats.active} <span className="text-lg opacity-20">/ {stats.units}</span></h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Guest Database</p>
          <h3 className="text-4xl font-black text-slate-950 tracking-tighter">{stats.guests}</h3>
        </div>
        <div className="bg-sky-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-sky-500/20 relative overflow-hidden">
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">Efficiency Index</p>
          <h3 className="text-4xl font-black tracking-tighter">{stats.units > 0 ? Math.round((stats.active/stats.units)*100) : 0}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* AI INSIGHT CARD - HIGH END UI */}
          <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden border-b-8 border-sky-500 shadow-2xl">
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
            <Sparkles className="absolute right-8 top-8 w-12 h-12 text-sky-400 animate-pulse opacity-40" />
            <h3 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
              <span className="p-2 bg-sky-500 rounded-lg"><Zap className="w-5 h-5 text-white" /></span>
              AI Business Intelligence
            </h3>
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4 relative z-10">
                <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Analyzing Hurghada Market Pulse...</p>
              </div>
            ) : (
              <div className="max-w-none relative z-10">
                <p className="text-slate-300 font-bold leading-relaxed whitespace-pre-wrap text-sm italic">
                  {aiInsight || "Add booking data to generate an automated financial net-profit analysis and operational tips."}
                </p>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black uppercase text-slate-950 tracking-tighter">Live Transaction Feed</h3>
              <ConciergeBell className="text-slate-300 w-6 h-6" />
            </div>
            <div className="p-8 space-y-4">
              {recentBookings.length > 0 ? recentBookings.map(b => (
                <div key={b.id} className="p-5 bg-slate-50 rounded-3xl flex items-center justify-between hover:bg-slate-100 transition-all cursor-pointer group border-2 border-transparent hover:border-slate-200" onClick={() => onOpenDetails(b.id)}>
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center border-2 border-slate-100 group-hover:border-sky-500 transition-colors shadow-sm">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Unit</span>
                        <span className="text-xl font-black text-sky-600 tracking-tighter">{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || '??'}</span>
                     </div>
                     <div>
                        <p className="font-black text-slate-950 text-base uppercase leading-none">{state.customers.find(c => c.id === b.customerId)?.name || 'Walk-in Guest'}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{b.startDate} → {b.endDate}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${b.status === 'stay' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{b.status}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-20 font-black text-xs uppercase tracking-[0.5em]">Zero Activity Records</div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-t-8 border-sky-400">
             <Wallet className="absolute -right-6 -bottom-6 w-40 h-40 opacity-5 rotate-12" />
             <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-slate-400">Portfolio Health</h3>
             <div className="space-y-8 relative z-10">
                <div className="pb-6 border-b border-white/5">
                   <p className="text-[9px] font-black text-sky-400 uppercase tracking-[0.2em] mb-2">Operational Cash</p>
                   <p className="text-3xl font-black tracking-tighter">{stats.revenue.toLocaleString()} <span className="text-xs opacity-40">EGP</span></p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Market Sentiment</p>
                   <div className="flex items-center gap-4">
                      <TrendingUp className="text-emerald-500 w-8 h-8" />
                      <span className="text-2xl font-black tracking-tighter uppercase">High Yield</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-sm">
             <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Inventory Status</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                   <span className="text-xs font-bold text-slate-600">Premium Suites</span>
                   <span className="text-lg font-black text-slate-950">{state.apartments.filter(a => a.rooms > 2).length}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                   <span className="text-xs font-bold text-slate-600">Pool View Units</span>
                   <span className="text-lg font-black text-slate-950">{state.apartments.filter(a => a.view.includes('Pool')).length}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
