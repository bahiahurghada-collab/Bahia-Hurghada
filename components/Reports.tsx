
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Scale, Calendar, Printer, Bed, Zap, FileText, Search, 
  CreditCard, DollarSign, Globe, ShoppingCart, Percent, Building2, ArrowUpRight, 
  ArrowDownRight, Filter, Download, PieChart, Wallet, Layers, Briefcase, Activity
} from 'lucide-react';
import { AppState, Booking, Expense, Currency } from '../types';
import { USD_TO_EGP_RATE, PLATFORMS } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEDGER' | 'UNITS' | 'CHANNELS' | 'EXPENSES'>('OVERVIEW');
  const [filterApt, setFilterApt] = useState<string>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Unified Transaction Generator
  const financialData = useMemo(() => {
    const transactions: any[] = [];
    const unitStats: Record<string, { revenue: number, projectedRevenue: number, expenses: number, services: number, commissions: number, bookingsCount: number, nightsSold: number }> = {};
    const channelStats: Record<string, { revenue: number, count: number }> = {};
    
    state.apartments.forEach(a => {
      unitStats[a.id] = { revenue: 0, projectedRevenue: 0, expenses: 0, services: 0, commissions: 0, bookingsCount: 0, nightsSold: 0 };
    });
    
    PLATFORMS.forEach(p => channelStats[p] = { revenue: 0, count: 0 });

    state.bookings.filter(b => b.status !== 'cancelled' && b.status !== 'maintenance' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      if (filterApt !== 'all' && b.apartmentId !== filterApt) return;

      const apt = state.apartments.find(a => a.id === b.apartmentId);
      const guest = state.customers.find(c => c.id === b.customerId);
      const rate = b.currency === 'USD' ? USD_TO_EGP_RATE : 1;
      
      const amountEGP = b.paidAmount * rate;
      const totalAmountEGP = b.totalAmount * rate;
      const commissionEGP = b.commissionAmount * rate;

      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

      const baseServicesEGP = b.services.reduce((acc, sid) => {
        const s = state.services.find(x => x.id === sid);
        return acc + (s ? s.price : 0);
      }, 0);

      const extraServicesEGP = (b.extraServices || []).reduce((acc, s) => {
        return acc + (s.isPaid ? s.price : 0);
      }, 0);

      const totalServicesEGP = baseServicesEGP + extraServicesEGP;
      const accommodationProjectedEGP = Math.max(0, totalAmountEGP - totalServicesEGP);

      if (unitStats[b.apartmentId]) {
        unitStats[b.apartmentId].revenue += amountEGP;
        unitStats[b.apartmentId].projectedRevenue += accommodationProjectedEGP;
        unitStats[b.apartmentId].services += totalServicesEGP;
        unitStats[b.apartmentId].commissions += commissionEGP;
        unitStats[b.apartmentId].bookingsCount += 1;
        unitStats[b.apartmentId].nightsSold += nights;
      }

      if (channelStats[b.platform]) {
        channelStats[b.platform].revenue += amountEGP;
        channelStats[b.platform].count += 1;
      }

      transactions.push({
        id: `rev-book-${b.id}`,
        date: b.startDate,
        type: 'INFLOW',
        category: 'Accommodation',
        ref: `${b.displayId} - Unit ${apt?.unitNumber}`,
        entity: guest?.name || 'Walk-in',
        amount: b.paidAmount,
        amountEGP,
        currency: b.currency,
        icon: Bed,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
      });

      if (totalServicesEGP > 0) {
        transactions.push({
          id: `rev-srv-${b.id}`,
          date: b.startDate,
          type: 'INFLOW',
          category: 'Amenities',
          ref: `Services for ${b.displayId}`,
          entity: guest?.name || 'Walk-in',
          amount: totalServicesEGP,
          amountEGP: totalServicesEGP,
          currency: 'EGP',
          icon: Zap,
          color: 'text-sky-600',
          bg: 'bg-sky-50'
        });
      }

      if (commissionEGP > 0) {
        transactions.push({
          id: `exp-comm-${b.id}`,
          date: b.startDate,
          type: 'OUTFLOW',
          category: 'Commission',
          ref: `Payout for ${b.displayId}`,
          entity: b.receptionistName || 'Platform',
          amount: b.commissionAmount,
          amountEGP: commissionEGP,
          currency: b.currency,
          icon: Percent,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        });
      }
    });

    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      if (filterApt !== 'all' && e.apartmentId && e.apartmentId !== filterApt) return;
      const rate = e.currency === 'USD' ? USD_TO_EGP_RATE : 1;
      const amountEGP = e.amount * rate;
      const apt = state.apartments.find(a => a.id === e.apartmentId);
      if (e.apartmentId && unitStats[e.apartmentId]) unitStats[e.apartmentId].expenses += amountEGP;
      transactions.push({
        id: `exp-gen-${e.id}`, date: e.date, type: 'OUTFLOW', category: e.category.toUpperCase(),
        ref: apt ? `Unit ${apt.unitNumber}` : 'General Ops', entity: e.description,
        amount: e.amount, amountEGP, currency: e.currency, icon: ShoppingCart, color: 'text-rose-600', bg: 'bg-rose-50'
      });
    });

    return { 
      transactions: transactions.sort((a,b) => b.date.localeCompare(a.date)),
      unitStats,
      channelStats
    };
  }, [state, dateRange, filterApt]);

  // Global Aggregates
  const aggregates = useMemo(() => {
    let grossInflow = 0;
    let grossOutflow = 0;
    let totalCommissions = 0;
    let totalServices = 0;
    let totalNightsSold = 0;
    let totalProjectedRoomRevenue = 0;

    financialData.transactions.forEach(t => {
      if (t.type === 'INFLOW') {
        grossInflow += t.amountEGP;
        if (t.category === 'Amenities') totalServices += t.amountEGP;
      } else {
        grossOutflow += t.amountEGP;
        if (t.category === 'Commission') totalCommissions += t.amountEGP;
      }
    });

    Object.values(financialData.unitStats).forEach(s => {
      totalNightsSold += s.nightsSold;
      totalProjectedRoomRevenue += s.projectedRevenue;
    });

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const rangeDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const totalCapacityNights = state.apartments.length * rangeDays;
    
    // ADR (Average Daily Rate) = إجمالي دخل الغرف الحقيقي / عدد الليالي المباعة فعلياً
    const adr = totalNightsSold > 0 ? totalProjectedRoomRevenue / totalNightsSold : 0;
    
    // RevPAR = إجمالي دخل الغرف المتوقع / إجمالي عدد الليالي المتاحة في المشروع كله
    const revpar = totalCapacityNights > 0 ? totalProjectedRoomRevenue / totalCapacityNights : 0;

    return {
      revenue: grossInflow,
      expenses: grossOutflow,
      profit: grossInflow - grossOutflow,
      commissions: totalCommissions,
      services: totalServices,
      margin: grossInflow > 0 ? ((grossInflow - grossOutflow) / grossInflow * 100).toFixed(1) : 0,
      adr,
      revpar,
      occupancy: totalCapacityNights > 0 ? (totalNightsSold / totalCapacityNights * 100).toFixed(1) : 0
    };
  }, [financialData, state.apartments, dateRange]);

  const handlePrint = () => { window.print(); };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24">
      {/* Smart Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-slate-950 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <Scale className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Matrix Ledger</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Unified Financial Intelligence v15.7
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 no-print">
          <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center gap-4 border border-slate-200 shadow-inner">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-slate-400" />
               <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent font-black text-xs outline-none" />
             </div>
             <span className="text-slate-300 font-black">→</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent font-black text-xs outline-none" />
          </div>
          <select className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest outline-none border-b-4 border-sky-600" value={filterApt} onChange={e => setFilterApt(e.target.value)}>
            <option value="all">Consolidated View</option>
            {state.apartments.map(a => <option key={a.id} value={a.id}>Unit {a.unitNumber}</option>)}
          </select>
          <button onClick={() => window.print()} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm" title="Print Report">
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5"><TrendingUp className="w-32 h-32" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Total Gross Inflow</p>
            <h3 className="text-4xl font-black tracking-tighter">{aggregates.revenue.toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
               <Bed className="w-3 h-3" /> {(aggregates.revenue - aggregates.services).toLocaleString()} Stays
               <span className="mx-1">•</span>
               <Zap className="w-3 h-3" /> {aggregates.services.toLocaleString()} Services
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Operational Outflow</p>
            <h3 className="text-4xl font-black tracking-tighter text-slate-900">{aggregates.expenses.toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
               <Percent className="w-3 h-3 text-amber-500" /> {aggregates.commissions.toLocaleString()} Commissions
               <span className="mx-1">•</span>
               <ShoppingCart className="w-3 h-3 text-rose-400" /> {(aggregates.expenses - aggregates.commissions).toLocaleString()} Ops
            </div>
         </div>

         <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10"><PieChart className="w-32 h-32" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Net Bottom Line</p>
            <h3 className="text-4xl font-black tracking-tighter">{aggregates.profit.toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            <div className="mt-6 flex items-center gap-2">
               <div className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">Margin: {aggregates.margin}%</div>
            </div>
         </div>

         <div className="bg-sky-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Active Utilization</p>
            <div className="flex items-end gap-3">
               <h3 className="text-5xl font-black tracking-tighter">{aggregates.occupancy}%</h3>
               <p className="text-[10px] font-black uppercase mb-2 opacity-50">Occupancy</p>
            </div>
         </div>
      </div>

      {/* Yield Optimization Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 p-10 space-y-8">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
               <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Yield Optimization Engine</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 group hover:border-sky-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Daily Rate (ADR)</p>
                        <h4 className="text-3xl font-black text-slate-900">{Math.round(aggregates.adr).toLocaleString()} EGP</h4>
                     </div>
                     <Wallet className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                    متوسط سعرك الفعلي لكل ليلة مباعة. هذا هو السعر الذي يدفعه العميل مقابل الغرفة فقط بدون خدمات.
                  </p>
               </div>
               <div className="bg-slate-950 p-8 rounded-[2rem] text-white group hover:border-sky-500 transition-all border-2 border-transparent">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">RevPAR (Smart Revenue)</p>
                        <h4 className="text-3xl font-black">{Math.round(aggregates.revpar).toLocaleString()} EGP</h4>
                     </div>
                     <Activity className="w-6 h-6 text-sky-400" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                    أهم مقياس أداء: متوسط ما تحققه "كل غرفة" عندك يومياً سواء كانت محجوزة أو فارغة. كلما اقترب هذا الرقم من الـ ADR كلما كان شغلك مثالي.
                  </p>
               </div>
            </div>
         </div>
         
         <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-950">Projected Health</h3>
            <div className="space-y-4">
               <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Occupancy Target</p>
                  <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-600" style={{width: `${aggregates.occupancy}%`}}></div>
                  </div>
                  <p className="text-[10px] font-black text-emerald-900 mt-2 text-right">{aggregates.occupancy}%</p>
               </div>
               <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed text-center">
                 "Your RevPAR is currenty {Math.round((aggregates.revpar/aggregates.adr)*100)}% of your ADR. Focus on filling midweek vacancies to boost overall yield."
               </p>
            </div>
         </div>
      </div>
      
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden no-print">
         <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <Layers className="w-6 h-6 text-slate-950" />
               <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Unified Master Ledger</h3>
            </div>
            <div className="relative w-full md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input placeholder="Filter Ledger..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border-2 border-slate-100 font-bold text-xs" value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} />
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/80 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                     <th className="px-10 py-6">Timeline</th>
                     <th className="px-10 py-6">Classification</th>
                     <th className="px-10 py-6 text-right">Value (EGP)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {financialData.transactions.filter(t => t.ref.toLowerCase().includes(ledgerSearch.toLowerCase())).map((t, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition-all">
                        <td className="px-10 py-6 text-[11px] font-black text-slate-400">{t.date}</td>
                        <td className="px-10 py-6 font-black text-slate-900 uppercase text-[12px]">{t.category} - {t.ref}</td>
                        <td className={`px-10 py-6 text-right font-black ${t.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {t.type === 'INFLOW' ? '+' : '-'}{t.amountEGP.toLocaleString()}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Reports;
