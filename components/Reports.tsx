
import React, { useState, useMemo } from 'react';
import { 
  Building2, Wallet, Layers, Download, BarChart3, Radio, Zap, ShoppingCart, Search, Printer, Calendar, Filter, ArrowUpRight, TrendingUp, FileSpreadsheet, Calculator, Landmark
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
      data.transactions.push({ date: e.date, ref: e.description, entity: 'Operational Outflow', type: 'OUT', amount: e.amount, currency: e.currency, unit: e.apartmentId ? state.apartments.find(a => a.id === e.apartmentId)?.unitNumber : 'General' });
    });

    return data;
  }, [state, dateRange]);

  const exportCSV = (type: string, headers: string[], rows: any[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_audit_${type}_${dateRange.start}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 font-bold">
      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-4 border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-8 no-print">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#1e293b] rounded-[2.5rem] flex items-center justify-center text-slate-100 shadow-2xl">
            <BarChart3 className="w-10 h-10 text-sky-400" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Financial Audit Control</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.5em] mt-3 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> BAHIA ACCOUNTING HUB V19.0 PRO
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="bg-slate-50 px-6 py-4 rounded-3xl flex items-center gap-6 border-2 border-slate-100 shadow-inner">
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-xs outline-none font-black text-slate-800" />
             </div>
             <span className="text-slate-300 font-black">→</span>
             <div className="flex items-center gap-2">
                <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-xs outline-none font-black text-slate-800" />
             </div>
          </div>
          <button onClick={() => window.print()} className="bg-[#1e293b] text-slate-100 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:bg-sky-600 transition-all border-b-4 border-slate-900">
            <Printer className="w-4 h-4" /> Export Ledger PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-2 bg-[#1e293b] border-2 border-slate-700 rounded-[3rem] w-fit mx-auto shadow-2xl no-print">
         {[
           { id: 'TREASURY', label: 'Vault Status', icon: Landmark },
           { id: 'UNITS', label: 'Unit Profits', icon: Building2 },
           { id: 'CHANNELS', label: 'Channel Index', icon: Radio },
           { id: 'EXPENSES', label: 'OpEx Ledger', icon: ShoppingCart },
           { id: 'LEDGER', label: 'Master Journal', icon: Layers }
         ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${activeTab === t.id ? 'bg-white text-slate-800 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}>
               <t.icon className="w-4 h-4" /> {t.label}
            </button>
         ))}
      </div>

      <div className="animate-in slide-in-from-bottom-6 duration-700">
         {activeTab === 'TREASURY' && (
            <div className="bg-white rounded-[4rem] border-4 border-slate-200 shadow-2xl overflow-hidden">
               <div className="p-10 bg-[#1e293b] text-slate-100 flex justify-between items-center border-b-4 border-sky-500">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-white/10 rounded-2xl"><Wallet className="w-6 h-6 text-sky-400" /></div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter">Treasury Liquidity Distribution</h3>
                  </div>
                  <button onClick={() => exportCSV('treasury', ['Method', 'USD', 'EGP', 'TotalEGP'], (Object.entries(finance.treasury) as [string, { egp: number, usd: number }][]).map(([k,v]) => [k, v.usd, v.egp, (v.egp + (v.usd * state.currentExchangeRate))]))} className="text-[10px] font-black uppercase bg-white/10 px-6 py-3 rounded-2xl hover:bg-sky-500 transition-all flex items-center gap-3 border border-white/10"><FileSpreadsheet className="w-4 h-4"/> Download CSV Matrix</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b-2 border-slate-100">
                           <th className="px-12 py-8">Payment Instrument</th>
                           <th className="px-12 py-8 text-right">USD Collected</th>
                           <th className="px-12 py-8 text-right">EGP Collected</th>
                           <th className="px-12 py-8 text-right">Settlement Value (EGP)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {(Object.entries(finance.treasury) as [string, { egp: number, usd: number }][]).map(([method, val]) => (
                           <tr key={method} className="hover:bg-slate-50 transition-all text-sm">
                              <td className="px-12 py-8 uppercase text-slate-800 font-black">{method}</td>
                              <td className="px-12 py-8 text-right text-sky-600 font-black">{val.usd.toLocaleString()} <span className="text-[10px] opacity-40">USD</span></td>
                              <td className="px-12 py-8 text-right text-emerald-600 font-black">{val.egp.toLocaleString()} <span className="text-[10px] opacity-40">EGP</span></td>
                              <td className="px-12 py-8 text-right text-slate-800 font-black text-lg">{(val.egp + (val.usd * (state.currentExchangeRate || 50))).toLocaleString()} £</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'UNITS' && (
            <div className="bg-white rounded-[4rem] border-4 border-slate-200 shadow-2xl overflow-hidden">
               <div className="p-10 bg-[#1e293b] text-slate-100 flex justify-between items-center border-b-4 border-emerald-500">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-white/10 rounded-2xl"><Building2 className="w-6 h-6 text-emerald-400" /></div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter">Portfolio Unit Profitability</h3>
                  </div>
                  <button onClick={() => exportCSV('unit_profits', ['Unit', 'Nights', 'GrossRev', 'OpEx', 'NetMargin'], state.apartments.map(a => [a.unitNumber, finance.unitStats[a.id].nights, finance.unitStats[a.id].stayRev, finance.unitStats[a.id].exp, (finance.unitStats[a.id].stayRev - finance.unitStats[a.id].exp)]))} className="text-[10px] font-black uppercase bg-white/10 px-6 py-3 rounded-2xl hover:bg-sky-500 transition-all flex items-center gap-3 border border-white/10"><FileSpreadsheet className="w-4 h-4"/> CSV Export</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b-2 border-slate-100">
                           <th className="px-12 py-8">Unit Asset</th>
                           <th className="px-12 py-8 text-right">Occupied Nights</th>
                           <th className="px-12 py-8 text-right">Gross Revenue (EGP)</th>
                           <th className="px-12 py-8 text-right">OpEx Deductions</th>
                           <th className="px-12 py-8 text-right">Net Portfolio Margin</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {state.apartments.map(apt => {
                           const s = finance.unitStats[apt.id];
                           const net = s.stayRev - s.exp;
                           return (
                              <tr key={apt.id} className="hover:bg-slate-50 transition-all text-sm">
                                 <td className="px-12 py-8 uppercase font-black text-slate-800">Unit {apt.unitNumber}</td>
                                 <td className="px-12 py-8 text-right text-slate-500">{s.nights} System Nights</td>
                                 <td className="px-12 py-8 text-right text-emerald-600 font-black">{s.stayRev.toLocaleString()}</td>
                                 <td className="px-12 py-8 text-right text-rose-600 font-black">-{s.exp.toLocaleString()}</td>
                                 <td className={`px-12 py-8 text-right font-black text-lg ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{net.toLocaleString()} EGP</td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'LEDGER' && (
            <div className="bg-white rounded-[4rem] border-4 border-slate-200 shadow-2xl overflow-hidden">
               <div className="p-10 bg-slate-50 border-b-4 border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 no-print">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-[#1e293b] text-slate-100 rounded-2xl"><Layers className="w-6 h-6" /></div>
                     <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">Master Financial Journal</h3>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input placeholder="Search Reference / ID..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border-2 border-slate-100 font-black text-xs outline-none focus:border-slate-400 transition-all text-slate-800" value={search} onChange={e => setSearch(e.target.value)} />
                     </div>
                     <button onClick={() => exportCSV('master_ledger', ['Date', 'Ref', 'Entity', 'Type', 'Amount', 'Currency'], finance.transactions.map(t => [t.date, t.ref, t.entity, t.type, t.amount, t.currency]))} className="p-4 bg-[#1e293b] text-slate-100 rounded-2xl hover:bg-sky-600 transition-all shadow-xl"><FileSpreadsheet className="w-6 h-6"/></button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-[#1e293b] text-slate-100 text-[10px] font-black uppercase tracking-widest">
                           <th className="px-12 py-8">Tx Date</th>
                           <th className="px-12 py-8">Ledger Reference</th>
                           <th className="px-12 py-8">Counterparty Entity</th>
                           <th className="px-12 py-8 text-right">Cash Movement</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {finance.transactions.filter(t => t.ref.toLowerCase().includes(search.toLowerCase()) || t.entity.toLowerCase().includes(search.toLowerCase())).map((t, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-sm">
                              <td className="px-12 py-6 text-slate-500 font-black">{t.date}</td>
                              <td className="px-12 py-6 uppercase font-black text-slate-800 text-base">{t.ref}</td>
                              <td className="px-12 py-6 uppercase font-bold text-slate-400">
                                 <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                                    {t.entity}
                                    <span className="text-[10px] opacity-40 ml-2">Unit {t.unit}</span>
                                 </div>
                              </td>
                              <td className={`px-12 py-6 text-right font-black text-lg ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {t.type === 'OUT' ? '−' : '+'}{t.amount.toLocaleString()} <span className="text-[10px] opacity-40">{t.currency}</span>
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
