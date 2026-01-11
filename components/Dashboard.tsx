
import React, { useState, useMemo } from 'react';
import { 
  Building2, ConciergeBell, Globe, Plus, Zap, Activity, Wallet, 
  CalendarClock, RefreshCw, Coins, ArrowLeftRight, Calculator,
  ChevronRight, ArrowDownLeft, ArrowUpRight as ArrowUp, Radio, TrendingUp, Landmark, CheckCircle2
} from 'lucide-react';
import { AppState, Booking } from '../types';
import { PLATFORMS } from '../constants';

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

const Dashboard: React.FC<DashboardProps> = ({ state, onOpenDetails, onTabChange, onUpdateRate, onRefreshRate, onQuickSettle, onFulfillService }) => {
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [convertDir, setConvertDir] = useState<'USD2EGP' | 'EGP2USD'>('USD2EGP');

  const todayStr = new Date().toISOString().split('T')[0];
  const next48hStr = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

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

  const tacticalOps = useMemo(() => {
    const ops: any[] = [];
    state.bookings.forEach(b => {
      if (b.status === 'cancelled' || b.status === 'maintenance') return;
      const customer = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
      const unit = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || '?';
      if (b.startDate >= todayStr && b.startDate <= next48hStr) ops.push({ id: b.id, type: 'ARRIVAL', guest: customer, unit, date: b.startDate, balance: b.totalAmount - b.paidAmount });
      if (b.endDate >= todayStr && b.endDate <= next48hStr) ops.push({ id: b.id, type: 'DEPARTURE', guest: customer, unit, date: b.endDate, balance: b.totalAmount - b.paidAmount });
    });
    return ops.sort((a, b) => a.date.localeCompare(b.date));
  }, [state, todayStr, next48hStr]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-bold">
      
      {/* Smart Liquidity Hub - Elite Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-slate-950 p-8 rounded-[3rem] text-white border-b-8 border-sky-500 shadow-2xl relative overflow-hidden">
          <Landmark className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 mb-4">Total Liquidity (EGP)</p>
          <h3 className="text-4xl font-black tracking-tighter">{liquidity.totalEGP.toLocaleString()}</h3>
          <p className="text-[9px] text-slate-500 mt-2 uppercase">Portfolio Net Assets</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-950 shadow-xl flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Vault: USD</p>
          <h3 className="text-3xl font-black text-slate-950">${liquidity.usd.toLocaleString()}</h3>
          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-sky-500 w-3/4"></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-950 shadow-xl flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Vault: EGP</p>
          <h3 className="text-3xl font-black text-slate-950">{liquidity.egp.toLocaleString()} <span className="text-xs">£</span></h3>
          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-emerald-500 w-1/2"></div>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between border-2 border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Live Rate</p>
            <button onClick={onRefreshRate} className="p-1 hover:text-sky-400 transition-all"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black">1.00</span>
            <span className="text-sky-500 font-black">=</span>
            <input type="number" value={state.currentExchangeRate} onChange={e => onUpdateRate?.(Number(e.target.value))} className="bg-transparent text-3xl font-black w-20 outline-none border-b-2 border-white/20 focus:border-sky-500 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tactical Command - Briefing (48h) */}
        <div className="bg-white rounded-[3.5rem] border-2 border-slate-950 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-500/30"><Radio className="w-6 h-6 animate-pulse" /></div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tighter">Tactical Briefing (48h)</h3>
                   <p className="text-[8px] font-black uppercase text-sky-400 tracking-widest">Active Movement Radar</p>
                </div>
             </div>
             <div className="flex gap-2">
                <span className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase">{tacticalOps.length} Events</span>
             </div>
          </div>
          <div className="p-8 space-y-4 flex-1 overflow-y-auto max-h-[550px] custom-scrollbar">
            {tacticalOps.map(op => (
               <div key={op.id + op.type} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] hover:border-slate-950 transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden">
                  <div className="flex items-center gap-6 relative z-10">
                     <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md ${op.type === 'ARRIVAL' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        {op.type}
                     </span>
                     <div>
                        <p className="text-base font-black text-slate-950 uppercase leading-none mb-1">{op.guest}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit {op.unit} • {op.date}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                     {op.balance > 0 && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onQuickSettle?.(op.id); }}
                           className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all shadow-xl"
                        >
                           <CheckCircle2 className="w-4 h-4" /> Settle {op.balance.toLocaleString()}
                        </button>
                     )}
                     <button onClick={() => onOpenDetails(op.id)} className="p-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-950 hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            ))}
            {tacticalOps.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No Operational Movements</div>}
          </div>
        </div>

        {/* System Pulse & Smart Conversion */}
        <div className="space-y-8">
           <div className="bg-white rounded-[3.5rem] p-8 border-2 border-slate-950 shadow-2xl">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-slate-950 border-b pb-4 border-slate-100"><Activity className="text-sky-500" /> System Live Pulse</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Daily Inflow (Est.)</p>
                    <p className="text-3xl font-black text-slate-950 leading-none">
                       {state.bookings.filter(b => b.startDate === todayStr).reduce((acc, b) => acc + b.paidAmount, 0).toLocaleString()} <span className="text-xs opacity-40">EGP</span>
                    </p>
                 </div>
                 <div className="p-6 bg-sky-50 rounded-[2.5rem] border-2 border-sky-100">
                    <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-4">Active Folios</p>
                    <p className="text-3xl font-black text-slate-950 leading-none">
                       {state.bookings.filter(b => b.status === 'stay').length} <span className="text-xs opacity-40">Units</span>
                    </p>
                 </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                 {PLATFORMS.filter(p => p !== 'None').map(p => (
                    <span key={p} className="px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       {p}: {state.bookings.filter(b => b.platform === p && b.status !== 'cancelled').length}
                    </span>
                 ))}
              </div>
           </div>

           <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <Calculator className="absolute -left-10 -bottom-10 w-48 h-48 opacity-5 rotate-12" />
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                 <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-4"><Calculator className="text-sky-400" /> Treasury Calculator</h3>
                 <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest">V19.0 Logic</span>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex-1">
                    <input type="number" value={convertAmount || ''} onChange={e => setConvertAmount(Number(e.target.value))} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[2rem] text-4xl font-black outline-none focus:border-sky-500 text-white" placeholder="0" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4 ml-4">{convertDir === 'USD2EGP' ? 'USD SOURCE' : 'EGP SOURCE'}</p>
                 </div>
                 <button onClick={() => setConvertDir(p => p === 'USD2EGP' ? 'EGP2USD' : 'USD2EGP')} className="p-6 bg-sky-500 rounded-full shadow-2xl hover:scale-110 transition-all text-white"><ArrowLeftRight className="w-8 h-8" /></button>
                 <div className="flex-1">
                    <div className="w-full bg-emerald-500/10 border-2 border-emerald-500/20 p-6 rounded-[2rem] text-4xl font-black text-emerald-400">
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
