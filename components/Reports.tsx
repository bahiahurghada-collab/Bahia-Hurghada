
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
    const unitStats: Record<string, { revenue: number, expenses: number, services: number, commissions: number, bookingsCount: number }> = {};
    const channelStats: Record<string, { revenue: number, count: number }> = {};
    
    // Initialize unit stats
    state.apartments.forEach(a => {
      unitStats[a.id] = { revenue: 0, expenses: 0, services: 0, commissions: 0, bookingsCount: 0 };
    });
    
    PLATFORMS.forEach(p => channelStats[p] = { revenue: 0, count: 0 });

    // 1. Process Bookings (Revenue & Commissions)
    state.bookings.filter(b => b.status !== 'cancelled' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      if (filterApt !== 'all' && b.apartmentId !== filterApt) return;

      const apt = state.apartments.find(a => a.id === b.apartmentId);
      const guest = state.customers.find(c => c.id === b.customerId);
      const rate = b.currency === 'USD' ? USD_TO_EGP_RATE : 1;
      const amountEGP = b.paidAmount * rate;
      const commissionEGP = b.commissionAmount * rate;

      // Split revenue: Calculate base services revenue
      const baseServicesEGP = b.services.reduce((acc, sid) => {
        const s = state.services.find(x => x.id === sid);
        return acc + (s ? s.price : 0); // Templates are in EGP
      }, 0);

      // Add extra services revenue
      const extraServicesEGP = (b.extraServices || []).reduce((acc, s) => {
        return acc + (s.isPaid ? s.price : 0); // Services stored in EGP
      }, 0);

      const totalServicesEGP = baseServicesEGP + extraServicesEGP;
      const accommodationEGP = Math.max(0, amountEGP - totalServicesEGP);

      // Add to unit stats
      if (unitStats[b.apartmentId]) {
        unitStats[b.apartmentId].revenue += accommodationEGP;
        unitStats[b.apartmentId].services += totalServicesEGP;
        unitStats[b.apartmentId].commissions += commissionEGP;
        unitStats[b.apartmentId].bookingsCount += 1;
      }

      // Add to channel stats
      if (channelStats[b.platform]) {
        channelStats[b.platform].revenue += amountEGP;
        channelStats[b.platform].count += 1;
      }

      // Add Booking Entry to Ledger
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

      // Add Services Entry to Ledger (if any)
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

      // Add Commission Outflow to Ledger
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

    // 2. Process Expenses (Outflows)
    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      if (filterApt !== 'all' && e.apartmentId && e.apartmentId !== filterApt) return;

      const rate = e.currency === 'USD' ? USD_TO_EGP_RATE : 1;
      const amountEGP = e.amount * rate;
      const apt = state.apartments.find(a => a.id === e.apartmentId);

      if (e.apartmentId && unitStats[e.apartmentId]) {
        unitStats[e.apartmentId].expenses += amountEGP;
      }

      transactions.push({
        id: `exp-gen-${e.id}`,
        date: e.date,
        type: 'OUTFLOW',
        category: e.category.toUpperCase(),
        ref: apt ? `Unit ${apt.unitNumber}` : 'General Ops',
        entity: e.description,
        amount: e.amount,
        amountEGP,
        currency: e.currency,
        icon: ShoppingCart,
        color: 'text-rose-600',
        bg: 'bg-rose-50'
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

    financialData.transactions.forEach(t => {
      if (t.type === 'INFLOW') {
        grossInflow += t.amountEGP;
        if (t.category === 'Amenities') totalServices += t.amountEGP;
      } else {
        grossOutflow += t.amountEGP;
        if (t.category === 'Commission') totalCommissions += t.amountEGP;
      }
    });

    return {
      revenue: grossInflow,
      expenses: grossOutflow,
      profit: grossInflow - grossOutflow,
      commissions: totalCommissions,
      services: totalServices,
      margin: grossInflow > 0 ? ((grossInflow - grossOutflow) / grossInflow * 100).toFixed(1) : 0
    };
  }, [financialData]);

  const exportMasterLedger = () => {
    const headers = ['Date', 'Type', 'Category', 'Reference', 'Entity', 'Amount', 'Currency', 'Amount EGP'];
    const rows = financialData.transactions.map(t => [
      t.date, t.type, t.category, t.ref, t.entity, t.amount, t.currency, t.amountEGP
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_master_ledger_${dateRange.start}_to_${dateRange.end}.csv`;
    link.click();
  };

  const filteredLedger = useMemo(() => {
    return financialData.transactions.filter(t => 
      t.ref.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      t.entity.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(ledgerSearch.toLowerCase())
    );
  }, [financialData.transactions, ledgerSearch]);

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
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Unified Financial Intelligence v15.5
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center gap-4 border border-slate-200 shadow-inner">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-slate-400" />
               <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent font-black text-xs outline-none" />
             </div>
             <span className="text-slate-300 font-black">→</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent font-black text-xs outline-none" />
          </div>
          
          <select 
            className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest outline-none border-b-4 border-sky-600"
            value={filterApt}
            onChange={e => setFilterApt(e.target.value)}
          >
            <option value="all">Consolidated View</option>
            {state.apartments.map(a => <option key={a.id} value={a.id}>Unit {a.unitNumber}</option>)}
          </select>

          <button onClick={exportMasterLedger} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm" title="Export CSV">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform duration-500"><TrendingUp className="w-32 h-32" /></div>
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
               <div className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Margin: {aggregates.margin}%
               </div>
               {Number(aggregates.margin) > 50 ? <ArrowUpRight className="w-5 h-5 text-white animate-bounce" /> : <ArrowDownRight className="w-5 h-5 text-white/50" />}
            </div>
         </div>

         <div className="bg-sky-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Active Utilization</p>
            <div className="flex items-end gap-3">
               <h3 className="text-5xl font-black tracking-tighter">
                  {state.apartments.length > 0 ? ((state.bookings.filter(b => b.status === 'stay').length / state.apartments.length) * 100).toFixed(0) : 0}%
               </h3>
               <p className="text-[10px] font-black uppercase mb-2 opacity-50">Occupancy</p>
            </div>
            <div className="mt-6 flex gap-1">
               {state.apartments.map((a, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${state.bookings.some(b => b.apartmentId === a.id && b.status === 'stay') ? 'bg-white' : 'bg-white/20'}`}></div>
               ))}
            </div>
         </div>
      </div>

      {/* Tabs Control */}
      <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-[2rem] w-fit mx-auto shadow-sm">
         {[
           {id: 'OVERVIEW', label: 'Financial Pulse', icon: Activity},
           {id: 'LEDGER', label: 'Master Ledger', icon: Layers},
           {id: 'UNITS', label: 'Unit Performance', icon: Building2},
           {id: 'EXPENSES', label: 'Outflow Analysis', icon: ShoppingCart},
           {id: 'CHANNELS', label: 'Channel Mix', icon: Globe}
         ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)} 
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
               <t.icon className="w-4 h-4" /> {t.label}
            </button>
         ))}
      </div>

      {/* Dynamic Content Area */}
      {activeTab === 'OVERVIEW' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 space-y-8">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Revenue Distribution</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-slate-400 uppercase">Core Accommodation</span>
                           <span className="text-xs font-black text-slate-950">{((aggregates.revenue - aggregates.services) / aggregates.revenue * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full bg-slate-950" style={{width: `${((aggregates.revenue - aggregates.services) / aggregates.revenue * 100)}%`}}></div>
                        </div>
                     </div>
                     <div className="p-6 bg-sky-50 rounded-3xl border border-sky-100">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-sky-600 uppercase">Extra Amenities</span>
                           <span className="text-xs font-black text-sky-950">{(aggregates.services / aggregates.revenue * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-3 bg-sky-200 rounded-full overflow-hidden">
                           <div className="h-full bg-sky-500" style={{width: `${(aggregates.services / aggregates.revenue * 100)}%`}}></div>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                     <p className="text-sm font-bold text-slate-500 leading-relaxed italic border-l-4 border-sky-500 pl-4">
                        "Your non-accommodation services are contributing <strong>{aggregates.services.toLocaleString()} EGP</strong> to the net bottom line. Increasing direct upsells could improve the net margin by an estimated 12%."
                     </p>
                  </div>
               </div>
            </div>
            
            <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl space-y-8">
               <h3 className="text-xl font-black uppercase tracking-tighter text-sky-400">Yield Optimization</h3>
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-sky-400" /></div>
                     <div>
                        <p className="text-[9px] font-black uppercase text-slate-500">Avg. Daily Rate (ADR)</p>
                        <p className="text-xl font-black">{financialData.transactions.filter(t => t.category === 'Accommodation').length > 0 ? (aggregates.revenue / financialData.transactions.filter(t => t.category === 'Accommodation').length).toFixed(0) : 0} EGP</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Briefcase className="w-5 h-5 text-emerald-400" /></div>
                     <div>
                        <p className="text-[9px] font-black uppercase text-slate-500">Revenue per Available Room (RevPAR)</p>
                        <p className="text-xl font-black">{(aggregates.revenue / (state.apartments.length || 1)).toFixed(0)} EGP</p>
                     </div>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                     <button className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-sky-600 transition-all">Download PDF Report</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'LEDGER' && (
         <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <Layers className="w-6 h-6 text-slate-950" />
                  <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Unified Master Ledger</h3>
               </div>
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    placeholder="Filter by ref, category or entity..." 
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border-2 border-slate-100 font-bold text-xs outline-none focus:border-sky-500 transition-all"
                    value={ledgerSearch}
                    onChange={e => setLedgerSearch(e.target.value)}
                  />
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/80 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                        <th className="px-10 py-6">Timeline</th>
                        <th className="px-10 py-6">Classification</th>
                        <th className="px-10 py-6">Reference / Entity</th>
                        <th className="px-10 py-6 text-right">Value (EGP)</th>
                        <th className="px-10 py-6 text-right">Orig. Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredLedger.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                           <td className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase">{t.date}</td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-xl ${t.bg} ${t.color}`}><t.icon className="w-4 h-4" /></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{t.category}</span>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{t.ref}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{t.entity}</p>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <span className={`text-sm font-black ${t.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {t.type === 'INFLOW' ? '+' : '-'}{t.amountEGP.toLocaleString()}
                              </span>
                           </td>
                           <td className="px-10 py-6 text-right text-[10px] font-bold text-slate-300">
                              {t.amount.toLocaleString()} {t.currency}
                           </td>
                        </tr>
                     ))}
                     {filteredLedger.length === 0 && (
                        <tr><td colSpan={5} className="py-24 text-center opacity-30 font-black text-sm uppercase tracking-widest">No matching ledger entries found</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {activeTab === 'UNITS' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {state.apartments.map(apt => {
               const stats = financialData.unitStats[apt.id] || { revenue: 0, expenses: 0, services: 0, commissions: 0, bookingsCount: 0 };
               const net = stats.revenue + stats.services - stats.expenses - stats.commissions;
               return (
                  <div key={apt.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-sky-500 transition-all group">
                     <div className="p-8 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Building2 className="w-16 h-16" /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Unit Folio</p>
                           <h4 className="text-3xl font-black tracking-tighter">U-{apt.unitNumber}</h4>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Reservations</p>
                           <p className="text-2xl font-black">{stats.bookingsCount}</p>
                        </div>
                     </div>
                     <div className="p-8 space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Accommodation</p>
                              <p className="text-sm font-black text-slate-900">{stats.revenue.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></p>
                           </div>
                           <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                              <p className="text-[8px] font-black text-sky-600 uppercase mb-1">Service Rev.</p>
                              <p className="text-sm font-black text-sky-950">{stats.services.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></p>
                           </div>
                           <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                              <p className="text-[8px] font-black text-amber-600 uppercase mb-1">Sales Comm.</p>
                              <p className="text-sm font-black text-amber-950">-{stats.commissions.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></p>
                           </div>
                           <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                              <p className="text-[8px] font-black text-rose-600 uppercase mb-1">Ops Expenses</p>
                              <p className="text-sm font-black text-slate-900">-{stats.expenses.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></p>
                           </div>
                        </div>
                        <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                           <span className="text-[10px] font-black text-slate-400 uppercase">Net Yield</span>
                           <span className={`text-xl font-black ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{net.toLocaleString()} EGP</span>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
      )}

      {activeTab === 'EXPENSES' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ShoppingCart className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Operational Breakdown</h3>
               </div>
               <div className="space-y-6">
                  {['MAINTENANCE', 'SUPPLIES', 'UTILITY', 'COMMISSION', 'OTHER'].map(cat => {
                     const catSum = financialData.transactions
                        .filter(t => t.type === 'OUTFLOW' && t.category === cat)
                        .reduce((acc, curr) => acc + curr.amountEGP, 0);
                     const percentage = aggregates.expenses > 0 ? (catSum / aggregates.expenses * 100).toFixed(0) : 0;
                     if (catSum === 0) return null;
                     return (
                        <div key={cat} className="space-y-2">
                           <div className="flex justify-between items-center px-2">
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{cat}</span>
                              <span className="text-sm font-black text-slate-900">{catSum.toLocaleString()} EGP <span className="text-[10px] text-slate-400 ml-2">({percentage}%)</span></span>
                           </div>
                           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500" style={{width: `${percentage}%`}}></div>
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>
            
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                  <TrendingDown className="w-6 h-6 text-rose-600" />
                  <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Recent Outflows</h3>
               </div>
               <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                  <table className="w-full text-left">
                     <tbody className="divide-y divide-slate-50">
                        {financialData.transactions.filter(t => t.type === 'OUTFLOW').map(t => (
                           <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                              <td className="px-8 py-5">
                                 <p className="text-[12px] font-black text-slate-900 uppercase leading-none">{t.entity}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{t.ref} • {t.date}</p>
                              </td>
                              <td className="px-8 py-5 text-right font-black text-rose-600">
                                 -{t.amountEGP.toLocaleString()} EGP
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'CHANNELS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {PLATFORMS.filter(p => financialData.channelStats[p]?.count > 0).map(p => (
              <div key={p} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-500 transition-all">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Globe className="w-24 h-24" /></div>
                 <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">{p}</p>
                 <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{financialData.channelStats[p].revenue.toLocaleString()} <span className="text-xs opacity-30">EGP</span></h4>
                 <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-400">Total Reservations</p>
                       <p className="text-sm font-black text-slate-900">{financialData.channelStats[p].count} Records</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black uppercase text-slate-400">Yield Share</p>
                       <p className="text-sm font-black text-emerald-600">{(financialData.channelStats[p].revenue / aggregates.revenue * 100).toFixed(1)}%</p>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
