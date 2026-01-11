
import React, { useState, useMemo } from 'react';
import { 
  Building2, ConciergeBell, Globe, Plus, Zap, Activity, Wallet, 
  CalendarClock, RefreshCw, Coins, ArrowLeftRight, Calculator,
  ChevronRight, ArrowDownLeft, ArrowUpRight as ArrowUp, Radio, TrendingUp, Landmark
} from 'lucide-react';
import { AppState, Booking } from '../types';
import { PLATFORMS } from '../constants';

// Added missing callback props to DashboardProps interface to fix TS error in App.tsx
interface DashboardProps {
  state: AppState;
  onAddService: (bookingId: string, serviceId: string, paymentMethod: string, isPaid: boolean) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onOpenDetails: (id: string) => void;
  onTabChange?: (tab: string) => void;
  onUpdateRate?: (rate: number) => void;
  onRefreshRate?: () => void;
  onQuickSettle?: (bookingId: string) => void;
  onFulfillService?: (bookingId: string, serviceId: string, isExtra?: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onOpenDetails, onTabChange, onUpdateRate, onRefreshRate }) => {
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [convertDir, setConvertDir] = useState<'USD2EGP' | 'EGP2USD'>('USD2EGP');

  const todayStr = new Date().toISOString().split('T')[0];
  const next48hStr = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  // مؤشرات السيولة الذكية
  const liquidity = useMemo(() => {
    let egp = 0; let usd = 0;
    state.bookings.forEach(b => {
      if (b.status !== 'cancelled') {
        if (b.currency === 'USD') usd += b.paidAmount;
        else egp += b.paidAmount;
      }
    });
    state.expenses.forEach(e => {
      if (e.currency === 'USD') usd -= e.amount;
      else egp -= e.amount;
    });
    return { egp, usd, totalEGP: egp + (usd * state.currentExchangeRate) };
  }, [state]);

  const platformStats = useMemo(() => {
    return PLATFORMS.filter(p => p !== 'None').map(platform => {
      const pBookings = state.bookings.filter(b => b.platform === platform && b.status !== 'cancelled');
      return {
        name: platform,
        past: pBookings.filter(b => b.endDate < todayStr).length,
        now: pBookings.filter(b => b.startDate <= todayStr && b.endDate >= todayStr).length,
        next: pBookings.filter(b => b.startDate > todayStr).length,
      };
    });
  }, [state.bookings, todayStr]);

  const tacticalOps = useMemo(() => {
    const ops: any[] = [];
    state.bookings.forEach(b => {
      if (b.status === 'cancelled' || b.status === 'maintenance') return;
      const customer = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
      const unit = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || '?';
      if (b.startDate >= todayStr && b.startDate <= next48hStr) ops.push({ id: b.id, type: 'ARRIVAL', guest: customer, unit, date: b.startDate });
      if (b.endDate >= todayStr && b.endDate <= next48hStr) ops.push({ id: b.id, type: 'DEPARTURE', guest: customer, unit, date: b.endDate });
    });
    return ops.sort((a, b) => a.date.localeCompare(b.date));
  }, [state, todayStr, next48hStr]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-bold">
      
      {/* Global Liquidity Index */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-slate-950 p-8 rounded-[3rem] text-white border-b-8 border-sky-500 shadow-2xl relative overflow-hidden group">
          <Landmark className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 mb-4">Net Liquidity (EGP)</p>
          <h3 className="text-4xl font-black tracking-tighter">{liquidity.totalEGP.toLocaleString()}</h3>
          <p className="text-[9px] text-slate-500 mt-2 uppercase tracking-widest">Normalized Portfolio Value</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Vault: USD</p>
          <h3 className="text-3xl font-black text-slate-950">${liquidity.usd.toLocaleString()}</h3>
          <div className="flex items-center gap-2 mt-4">
             <div className="h-1 flex-1 bg-sky-100 rounded-full overflow-hidden"><div className="h-full bg-sky-500 w-2/3"></div></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Vault: EGP</p>
          <h3 className="text-3xl font-black text-slate-950">{liquidity.egp.toLocaleString()} <span className="text-xs">£</span></h3>
          <div className="flex items-center gap-2 mt-4">
             <div className="h-1 flex-1 bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-1/2"></div></div>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">FX Index</p>
            <button onClick={onRefreshRate} className="p-1 hover:text-sky-400"><RefreshCw className="w-3 h-3" /></button>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black">1.00</span>
            <span className="text-xs opacity-40 mb-1">USD</span>
            <span className="mx-2 text-sky-500">=</span>
            <input type="number" value={state.currentExchangeRate} onChange={e => onUpdateRate?.(Number(e.target.value))} className="bg-transparent text-3xl font-black w-20 outline-none border-b border-white/20 focus:border-sky-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tactical Command - Briefing (48h) */}
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500 rounded-2xl"><Radio className="w-6 h-6 animate-pulse" /></div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tighter">Tactical Briefing (48h)</h3>
                   <p className="text-[8px] font-black uppercase text-sky-400 tracking-widest">Operational Movements Center</p>
                </div>
             </div>
             <button onClick={() => onTabChange?.('calendar')} className="p-3 bg-white/10 hover:bg-sky-500 rounded-xl transition-all"><ArrowUp className="w-5 h-5" /></button>
          </div>
          <div className="p-8 space-y-4 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {tacticalOps.map(op => (
               <div key={op.id + op.type} onClick={() => onOpenDetails(op.id)} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-sky-500 transition-all cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                     <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${op.type === 'ARRIVAL' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        {op.type}
                     </span>
                     <div>
                        <p className="text-sm font-black text-slate-950 uppercase">{op.guest}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unit {op.unit} • {op.date}</p>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-500 transition-all" />
               </div>
            ))}
          </div>
        </div>

        {/* Pulse & Conversions */}
        <div className="space-y-8">
           <div className="bg-white rounded-[3.5rem] p-8 border border-slate-200 shadow-xl">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-slate-950"><Activity className="text-sky-500" /> Channel Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {platformStats.map(ps => (
                    <div key={ps.name} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-slate-950 transition-all">
                       <p className="text-[9px] font-black uppercase text-slate-400 group-hover:text-sky-400 mb-4 text-center">{ps.name}</p>
                       <div className="flex justify-around items-end h-12">
                          <div className="text-center"><span className="block text-[8px] font-black text-slate-300 uppercase">Past</span><span className="text-xs font-black text-slate-400 group-hover:text-white">{ps.past}</span></div>
                          <div className="text-center"><span className="block text-[8px] font-black text-emerald-500 uppercase">Now</span><span className="text-lg font-black text-slate-950 group-hover:text-white">{ps.now}</span></div>
                          <div className="text-center"><span className="block text-[8px] font-black text-sky-400 uppercase">Next</span><span className="text-xs font-black text-slate-400 group-hover:text-white">{ps.next}</span></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <Calculator className="absolute -left-10 -bottom-10 w-48 h-48 opacity-5 rotate-12" />
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4"><Calculator className="text-sky-400" /> Smart FX Converter</h3>
              <div className="flex items-center gap-6">
                 <div className="flex-1">
                    <input type="number" value={convertAmount || ''} onChange={e => setConvertAmount(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] text-4xl font-black outline-none focus:border-sky-500" placeholder="0" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4 ml-4">{convertDir === 'USD2EGP' ? 'USD SOURCE' : 'EGP SOURCE'}</p>
                 </div>
                 <button onClick={() => setConvertDir(p => p === 'USD2EGP' ? 'EGP2USD' : 'USD2EGP')} className="p-6 bg-sky-500 rounded-full shadow-2xl shadow-sky-500/20 hover:scale-110 transition-all"><ArrowLeftRight className="w-8 h-8" /></button>
                 <div className="flex-1">
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] text-4xl font-black text-emerald-400">
                       {(convertDir === 'USD2EGP' ? convertAmount * state.currentExchangeRate : convertAmount / state.currentExchangeRate).toFixed(2)}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50 mt-4 ml-4">SETTLEMENT VALUE</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
