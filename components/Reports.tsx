
import React, { useState, useMemo } from 'react';
import { 
  Building2, Wallet, Layers, Download, BarChart3, Radio, Zap, ShoppingCart, Search, Printer, Calendar, Filter, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { AppState, Currency } from '../types';
import { PAYMENT_METHODS, PLATFORMS } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'TREASURY' | 'UNITS' | 'CHANNELS' | 'EXPENSES' | 'LEDGER'>('TREASURY');
  const [search, setSearch] = useState('');

  const finance = useMemo(() => {
    const data = {
      transactions: [] as any[],
      unitStats: {} as Record<string, { stayRev: number, nights: number, bookings: number, exp: number }>,
      channelStats: {} as Record<string, { revenue: number, count: number }>,
      expenseStats: { total: 0, items: [] as any[] },
      treasury: {} as Record<string, { egp: number, usd: number }>
    };

    state.apartments.forEach(a => data.unitStats[a.id] = { stayRev: 0, nights: 0, bookings: 0, exp: 0 });
    PLATFORMS.forEach(p => data.channelStats[p] = { revenue: 0, count: 0 });
    PAYMENT_METHODS.forEach(m => data.treasury[m] = { egp: 0, usd: 0 });

    state.bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const inRange = b.startDate >= dateRange.start && b.startDate <= dateRange.end;
      if (!inRange) return;

      const rate = b.exchangeRateAtBooking || state.currentExchangeRate || 50;
      const isUSD = b.currency === 'USD';
      const serviceEGP = (b.services || []).reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0);
      const stayRevEGP = Math.max(0, (isUSD ? b.totalAmount * rate : b.totalAmount) - serviceEGP);

      if (data.unitStats[b.apartmentId]) {
        const u = data.unitStats[b.apartmentId];
        u.stayRev += stayRevEGP;
        u.bookings += 1;
        u.nights += Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)));
      }

      if (data.channelStats[b.platform]) {
        data.channelStats[b.platform].revenue += (isUSD ? b.totalAmount * rate : b.totalAmount);
        data.channelStats[b.platform].count += 1;
      }

      if (data.treasury[b.paymentMethod]) {
        if (isUSD) data.treasury[b.paymentMethod].usd += b.paidAmount;
        else data.treasury[b.paymentMethod].egp += b.paidAmount;
      }

      data.transactions.push({ date: b.startDate, ref: b.displayId, entity: state.customers.find(c => c.id === b.customerId)?.name, type: 'IN', amount: b.paidAmount, currency: b.currency, unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber });
    });

    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      const amountEGP = e.currency === 'USD' ? e.amount * (state.currentExchangeRate || 50) : e.amount;
      data.expenseStats.total += amountEGP;
      if (e.apartmentId && data.unitStats[e.apartmentId]) data.unitStats[e.apartmentId].exp += amountEGP;
      data.transactions.push({ date: e.date, ref: e.description, entity: 'Operational', type: 'OUT', amount: e.amount, currency: e.currency, unit: e.apartmentId ? state.apartments.find(a => a.id === e.apartmentId)?.unitNumber : 'Gen' });
    });

    return data;
  }, [state, dateRange]);

  const exportCSV = (type: string, headers: string[], rows: any[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_finance_${type}_${dateRange.start}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 font-bold">
      
      {/* Smart Control Header */}
      <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border-b-8 border-slate-950 flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <BarChart3 className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Financial Intelligence</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> BAHIA AUDIT ENGINE V22.5
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center gap-4 border border-slate-200 shadow-inner">
             <Calendar className="w-4 h-4 text-slate-400" />
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-xs outline-none" />
             <span className="text-slate-300">→</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-xs outline-none" />
          </div>
          <button onClick={() => window.print()} className="bg-slate-950 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-sky-500 transition-all">
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Modern Navigation */}
      <div className="flex flex-wrap gap-2 p-2 bg-white border border-slate-200 rounded-[2.5rem] w-fit mx-auto shadow-sm no-print">
         {[
           { id: 'TREASURY', label: 'Treasury', icon: Wallet },
           { id: 'UNITS', label: 'Unit Profits', icon: Building2 },
           { id: 'CHANNELS', label: 'Channels', icon: Radio },
           { id: 'EXPENSES', label: 'Expenses', icon: ShoppingCart },
           { id: 'LEDGER', label: 'Master Journal', icon: Layers }
         ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
               <t.icon className="w-4 h-4" /> {t.label}
            </button>
         ))}
      </div>

      {/* Professional Data Tables */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
         
         {activeTab === 'TREASURY' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Treasury Liquidity Table</h3>
                  <button onClick={() => exportCSV('treasury', ['Method', 'USD', 'EGP'], Object.entries(finance.treasury).map(([k,v]) => [k, v.usd, v.egp]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Method</th>
                           <th className="px-10 py-6 text-right">USD Assets</th>
                           <th className="px-10 py-6 text-right">EGP Assets</th>
                           <th className="px-10 py-6 text-right">Normalized Total (EGP)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {Object.entries(finance.treasury).map(([method, val]) => (
                           <tr key={method} className="hover:bg-slate-50 transition-all text-xs">
                              <td className="px-10 py-6 uppercase">{method}</td>
                              <td className="px-10 py-6 text-right text-sky-600">{val.usd.toLocaleString()} <span className="text-[9px] opacity-40">USD</span></td>
                              <td className="px-10 py-6 text-right text-emerald-600">{val.egp.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></td>
                              <td className="px-10 py-6 text-right text-slate-950 font-black">{(val.egp + (val.usd * (state.currentExchangeRate || 50))).toLocaleString()} EGP</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'UNITS' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Asset Profitability Matrix</h3>
                  <button onClick={() => exportCSV('unit_profits', ['Unit', 'Bookings', 'Rev', 'Exp', 'Net'], state.apartments.map(a => [a.unitNumber, finance.unitStats[a.id].bookings, finance.unitStats[a.id].stayRev, finance.unitStats[a.id].exp, (finance.unitStats[a.id].stayRev - finance.unitStats[a.id].exp)]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Unit</th>
                           <th className="px-10 py-6 text-right">Volume</th>
                           <th className="px-10 py-6 text-right">Stay Rev (EGP)</th>
                           <th className="px-10 py-6 text-right">OpEx (EGP)</th>
                           <th className="px-10 py-6 text-right">Net Margin</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {state.apartments.map(apt => {
                           const s = finance.unitStats[apt.id];
                           const net = s.stayRev - s.exp;
                           return (
                              <tr key={apt.id} className="hover:bg-slate-50 transition-all text-xs">
                                 <td className="px-10 py-6 uppercase font-black">Unit {apt.unitNumber}</td>
                                 <td className="px-10 py-6 text-right text-slate-400">{s.bookings} Reserv.</td>
                                 <td className="px-10 py-6 text-right text-emerald-600">{s.stayRev.toLocaleString()}</td>
                                 <td className="px-10 py-6 text-right text-rose-500">-{s.exp.toLocaleString()}</td>
                                 <td className={`px-10 py-6 text-right font-black ${net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{net.toLocaleString()} EGP</td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'LEDGER' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
               <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
                  <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Master Financial Ledger</h3>
                  <div className="flex items-center gap-4">
                     <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input placeholder="Search Journal..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-[10px]" value={search} onChange={e => setSearch(e.target.value)} />
                     </div>
                     <button onClick={() => exportCSV('master_ledger', ['Date', 'Ref', 'Entity', 'Type', 'Amount'], finance.transactions.map(t => [t.date, t.ref, t.entity, t.type, t.amount]))} className="p-3 bg-slate-950 text-white rounded-xl hover:bg-sky-600 transition-all"><Download className="w-5 h-5"/></button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Date</th>
                           <th className="px-10 py-6">Reference</th>
                           <th className="px-10 py-6">Entity</th>
                           <th className="px-10 py-6 text-right">Cash Movement</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {finance.transactions.filter(t => t.ref.toLowerCase().includes(search.toLowerCase())).map((t, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-xs">
                              <td className="px-10 py-6 text-slate-400">{t.date}</td>
                              <td className="px-10 py-6 uppercase font-black text-slate-950">{t.ref}</td>
                              <td className="px-10 py-6 uppercase font-bold text-slate-400">{t.entity}</td>
                              <td className={`px-10 py-6 text-right font-black ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {t.type === 'OUT' ? '-' : '+'}{t.amount.toLocaleString()} <span className="text-[9px] opacity-40">{t.currency}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

      </div>
    </div>
  );
};

export default Reports;
