
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Calendar, Printer, Bed, Zap, Search, 
  ShoppingCart, Percent, Building2, Wallet, Layers, 
  Landmark, Coins, Smartphone, Calculator, AlertCircle, ArrowRight,
  FileSpreadsheet, CheckCircle, Clock, Download, Activity, PieChart, DollarSign, Filter, X, RefreshCw, ArrowLeftRight, UserCheck
} from 'lucide-react';
import { AppState, Booking, Expense, Currency } from '../types';
import { PAYMENT_METHODS } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'TREASURY' | 'UNITS' | 'LEDGER' | 'SERVICES' | 'EXPENSES'>('TREASURY');
  const [ledgerSearch, setLedgerSearch] = useState('');
  
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [convertDir, setConvertDir] = useState<'USD2EGP' | 'EGP2USD'>('USD2EGP');

  // 1. Fixed Accounting Engine
  const finance = useMemo(() => {
    const data = {
      transactions: [] as any[],
      unitPerformance: {} as Record<string, { stayRevenue: number, nights: number, bookings: number, expenses: number }>,
      serviceRevenue: { total: 0, items: [] as any[] },
      commissionStats: { total: 0, paid: 0, pending: 0 },
      expensesStats: { total: 0, categories: {} as Record<string, number> },
      byPaymentMethod: {} as Record<string, { collectedEGP: number, collectedUSD: number }>,
      totalGrossEGP: 0,
      totalGrossUSD: 0,
      totalReceivablesEGP: 0,
      totalReceivablesUSD: 0
    };

    state.apartments.forEach(a => {
      data.unitPerformance[a.id] = { stayRevenue: 0, nights: 0, bookings: 0, expenses: 0 };
    });

    PAYMENT_METHODS.forEach(m => {
      data.byPaymentMethod[m] = { collectedEGP: 0, collectedUSD: 0 };
    });

    state.bookings.filter(b => b.status !== 'cancelled' && b.status !== 'maintenance' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      const isUSD = b.currency === 'USD';
      const rate = b.exchangeRateAtBooking || state.currentExchangeRate;
      
      // Fix: Services are always entered in EGP in the system templates
      const baseServicesValEGP = b.services.reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0);
      const extraServicesValEGP = (b.extraServices || []).reduce((acc, es) => acc + es.price, 0);
      const totalServicesEGP = baseServicesValEGP + extraServicesValEGP;

      // FIX: Calculate Stay Revenue in EGP correctly by converting total first if needed
      const totalAmountEGP = isUSD ? b.totalAmount * rate : b.totalAmount;
      const stayOnlyRevenueEGP = totalAmountEGP - totalServicesEGP;

      // Global Stats
      if (isUSD) {
        data.totalGrossUSD += b.totalAmount;
        data.totalReceivablesUSD += (b.totalAmount - b.paidAmount);
        if (data.byPaymentMethod[b.paymentMethod]) data.byPaymentMethod[b.paymentMethod].collectedUSD += b.paidAmount;
      } else {
        data.totalGrossEGP += b.totalAmount;
        data.totalReceivablesEGP += (b.totalAmount - b.paidAmount);
        if (data.byPaymentMethod[b.paymentMethod]) data.byPaymentMethod[b.paymentMethod].collectedEGP += b.paidAmount;
      }

      // Unit Stats (Stay Revenue Only - Verified Positive)
      if (data.unitPerformance[b.apartmentId]) {
        const up = data.unitPerformance[b.apartmentId];
        const nights = Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)));
        up.stayRevenue += stayOnlyRevenueEGP;
        up.nights += nights;
        up.bookings += 1;
      }

      // Services Stats (Always normalized to EGP for the chart)
      data.serviceRevenue.total += totalServicesEGP;
      if (totalServicesEGP > 0) {
        data.serviceRevenue.items.push({
          date: b.startDate,
          guest: state.customers.find(c => c.id === b.customerId)?.name,
          amount: totalServicesEGP,
          currency: 'EGP',
          unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber
        });
      }

      // Commissions
      const commEGP = isUSD ? b.commissionAmount * rate : b.commissionAmount;
      data.commissionStats.total += commEGP;
      if (b.commissionPaid) data.commissionStats.paid += commEGP;
      else data.commissionStats.pending += commEGP;

      data.transactions.push({
        date: b.startDate,
        ref: b.displayId,
        entity: state.customers.find(c => c.id === b.customerId)?.name,
        type: 'INFLOW',
        amount: b.paidAmount,
        currency: b.currency,
        unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber
      });
    });

    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      const isUSD = e.currency === 'USD';
      const rate = state.currentExchangeRate;
      const amountEGP = isUSD ? e.amount * rate : e.amount;

      data.expensesStats.total += amountEGP;
      data.expensesStats.categories[e.category] = (data.expensesStats.categories[e.category] || 0) + amountEGP;

      if (e.apartmentId && data.unitPerformance[e.apartmentId]) {
        data.unitPerformance[e.apartmentId].expenses += amountEGP;
      }

      data.transactions.push({
        date: e.date,
        ref: e.description,
        entity: 'Operating Cost',
        type: 'OUTFLOW',
        amount: e.amount,
        currency: e.currency,
        unit: e.apartmentId ? state.apartments.find(a => a.id === e.apartmentId)?.unitNumber : 'General'
      });
    });

    return data;
  }, [state, dateRange]);

  const normalizedNet = useMemo(() => {
    const rate = state.currentExchangeRate;
    const totalIn = finance.totalGrossEGP + (finance.totalGrossUSD * rate);
    const totalOut = finance.expensesStats.total + finance.commissionStats.total;
    return totalIn - totalOut;
  }, [finance, state.currentExchangeRate]);

  const convertedValue = useMemo(() => {
    if (convertDir === 'USD2EGP') return (convertAmount * state.currentExchangeRate).toFixed(2);
    return (convertAmount / state.currentExchangeRate).toFixed(4);
  }, [convertAmount, convertDir, state.currentExchangeRate]);

  const exportCSV = () => {
    const headers = ['Date', 'Ref', 'Entity', 'Unit', 'Type', 'Amount', 'Currency'];
    const rows = finance.transactions.map(t => [t.date, t.ref, t.entity, t.unit, t.type, t.amount, t.currency]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_financial_ledger.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 font-bold">
      <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border-b-8 border-slate-950 flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <Landmark className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Financial Auditor</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> BAHIA HURGHADA | V21.5 FIXED
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
          <button onClick={exportCSV} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all">
            <Download className="w-4 h-4" /> Export Ledger
          </button>
          <button onClick={() => window.print()} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-sky-500 transition-all">
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
         <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-24 h-24" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-2">Total Gross (Dual)</p>
            <h3 className="text-2xl font-black">{finance.totalGrossUSD.toLocaleString()} <span className="text-xs opacity-30">USD</span></h3>
            <h3 className="text-2xl font-black">{finance.totalGrossEGP.toLocaleString()} <span className="text-xs opacity-30">EGP</span></h3>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Income Analytics</p>
            <div className="space-y-3">
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Services Only</p>
                  <p className="text-xl font-black text-slate-900">{finance.serviceRevenue.total.toLocaleString()} <span className="text-[10px]">EGP</span></p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Normalized Net</p>
                  <p className="text-xl font-black text-emerald-600">{normalizedNet.toLocaleString()} <span className="text-[10px]">EGP</span></p>
               </div>
            </div>
         </div>

         <div className="bg-rose-50 p-8 rounded-[2.5rem] border-2 border-rose-100 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Total Payables</p>
            <div className="space-y-3">
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Total Expenses</p>
                  <p className="text-xl font-black text-rose-600">{finance.expensesStats.total.toLocaleString()} <span className="text-[10px]">EGP</span></p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Commissions Due</p>
                  <p className="text-xl font-black text-rose-600">{finance.commissionStats.pending.toLocaleString()} <span className="text-[10px]">EGP</span></p>
               </div>
            </div>
         </div>

         <div className="bg-sky-50 p-8 rounded-[2.5rem] border-2 border-sky-100 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-2">Internal Conversion</p>
            <div className="space-y-2">
               <div className="flex gap-2">
                  <input type="number" value={convertAmount || ''} onChange={e => setConvertAmount(parseFloat(e.target.value))} className="w-full p-2 rounded-lg border border-sky-100 font-black text-xs outline-none" placeholder="Amount..." />
                  <button onClick={() => setConvertDir(prev => prev === 'USD2EGP' ? 'EGP2USD' : 'USD2EGP')} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-slate-900 transition-all"><ArrowLeftRight className="w-3 h-3" /></button>
               </div>
               <div className="p-2 bg-white rounded-lg border border-sky-100 flex justify-between">
                  <span className="text-lg font-black text-sky-700">{convertedValue}</span>
                  <span className="text-[8px] font-black text-slate-300 uppercase mt-2">{convertDir === 'USD2EGP' ? 'EGP' : 'USD'}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 rounded-[2.5rem] w-fit mx-auto shadow-sm no-print">
         {[
           {id: 'TREASURY', label: 'Treasury', icon: Wallet},
           {id: 'UNITS', label: 'Unit Profits', icon: Building2},
           {id: 'SERVICES', label: 'Amenity Rev', icon: Zap},
           {id: 'EXPENSES', label: 'Expenses/Purchases', icon: ShoppingCart},
           {id: 'LEDGER', label: 'Master Ledger', icon: Layers}
         ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
               <t.icon className="w-4 h-4" /> {t.label}
            </button>
         ))}
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
         {activeTab === 'UNITS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {state.apartments.map(apt => {
                  const u = finance.unitPerformance[apt.id] || { stayRevenue: 0, nights: 0, bookings: 0, expenses: 0 };
                  const net = u.stayRevenue - u.expenses;
                  return (
                     <div key={apt.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-slate-950 transition-all">
                        <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                           <div>
                              <h4 className="text-2xl font-black tracking-tighter uppercase leading-none">Unit {apt.unitNumber}</h4>
                              <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest mt-2">{apt.view}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black uppercase opacity-40">Unit Profit</p>
                              <p className={`text-xl font-black ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{net.toLocaleString()} EGP</p>
                           </div>
                        </div>
                        <div className="p-8 space-y-4">
                           <div className="flex justify-between border-b pb-2">
                              <span className="text-[10px] uppercase font-black text-slate-400">Stay Revenue (EGP)</span>
                              <span className="text-sm font-black text-slate-900">{u.stayRevenue.toLocaleString()} EGP</span>
                           </div>
                           <div className="flex justify-between border-b pb-2">
                              <span className="text-[10px] uppercase font-black text-slate-400">Unit Expenses</span>
                              <span className="text-sm font-black text-rose-500">-{u.expenses.toLocaleString()} EGP</span>
                           </div>
                           <div className="flex justify-between pt-2">
                              <span className="text-[10px] uppercase font-black text-slate-400">Occupancy Nights</span>
                              <span className="text-sm font-black text-sky-600">{u.nights} Nights</span>
                           </div>
                        </div>
                     </div>
                  )
               })}
            </div>
         )}
         {/* ... Other tabs follow the same structure from previous versions ... */}
         {activeTab === 'SERVICES' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Amenity Income Ledger</h3>
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase opacity-40">Total Revenue</p>
                     <p className="text-3xl font-black text-emerald-400">{finance.serviceRevenue.total.toLocaleString()} EGP</p>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-8 py-5">Date</th>
                           <th className="px-8 py-5">Guest Profile</th>
                           <th className="px-8 py-5">Origin Unit</th>
                           <th className="px-8 py-5 text-right">Service Value (EGP)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {finance.serviceRevenue.items.map((item, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-[11px]">
                              <td className="px-8 py-5 text-slate-400">{item.date}</td>
                              <td className="px-8 py-5 font-black uppercase text-slate-900">{item.guest}</td>
                              <td className="px-8 py-5 font-black text-sky-600 uppercase">U-{item.unit}</td>
                              <td className="px-8 py-5 text-right font-black text-emerald-600">
                                 {item.amount.toLocaleString()} <span className="text-[9px] opacity-40">{item.currency}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'EXPENSES' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(finance.expensesStats.categories).map(([cat, val]) => (
                     <div key={cat} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{cat}</p>
                        <p className="text-3xl font-black text-rose-600">{val.toLocaleString()} <span className="text-xs">EGP</span></p>
                     </div>
                  ))}
               </div>
               <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Purchases & Outflows Journal</h3>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                              <th className="px-8 py-5">Date</th>
                              <th className="px-8 py-5">Description / Source</th>
                              <th className="px-8 py-5">Target Unit</th>
                              <th className="px-8 py-5 text-right">Outflow Amount</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {finance.transactions.filter(t => t.type === 'OUTFLOW').map((t, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-all text-[11px]">
                                 <td className="px-8 py-5 text-slate-400">{t.date}</td>
                                 <td className="px-8 py-5 font-black text-slate-900 uppercase">{t.ref}</td>
                                 <td className="px-8 py-5 font-black text-slate-400">U-{t.unit}</td>
                                 <td className="px-8 py-5 text-right font-black text-rose-600">
                                    -{t.amount.toLocaleString()} <span className="text-[9px] opacity-40">{t.currency}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'LEDGER' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
                  <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Master Financial Journal</h3>
                  <div className="relative w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input placeholder="Search records..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-[10px]" value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} />
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold border-collapse min-w-[1000px]">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-8 py-5">Date</th>
                           <th className="px-8 py-5">Source / Ref</th>
                           <th className="px-8 py-5">Entity</th>
                           <th className="px-8 py-5">Unit</th>
                           <th className="px-8 py-5 text-right">Flow Value</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {finance.transactions.filter(t => t.ref.toLowerCase().includes(ledgerSearch.toLowerCase())).map((t, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-[11px]">
                              <td className="px-8 py-5 text-slate-400">{t.date}</td>
                              <td className="px-8 py-5 font-black text-slate-900 uppercase">{t.ref}</td>
                              <td className="px-8 py-5 font-black text-slate-500 uppercase">{t.entity}</td>
                              <td className="px-8 py-5 font-black text-sky-600">U-{t.unit}</td>
                              <td className={`px-8 py-5 text-right font-black ${t.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {t.type === 'OUTFLOW' ? '-' : '+'}{t.amount.toLocaleString()} <span className="text-[9px] opacity-40">{t.currency}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'TREASURY' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Landmark className="w-6 h-6" /></div>
                     <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Net Liquidity (Paid)</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {PAYMENT_METHODS.map(method => {
                        const s = finance.byPaymentMethod[method];
                        if (!s || (s.collectedEGP === 0 && s.collectedUSD === 0)) return null;
                        return (
                           <div key={method} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">{method}</span>
                              <div className="space-y-2">
                                 <p className="text-xl font-black text-sky-600">{s.collectedUSD.toLocaleString()} <span className="text-[9px]">USD</span></p>
                                 <p className="text-xl font-black text-emerald-600">{s.collectedEGP.toLocaleString()} <span className="text-[9px]">EGP</span></p>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </div>
               <div className="bg-rose-50 rounded-[3rem] border-2 border-rose-100 p-10 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg"><AlertCircle className="w-6 h-6" /></div>
                     <h3 className="text-xl font-black uppercase text-rose-950 tracking-tighter">Outstanding Balance (Receivables)</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-white rounded-3xl border border-rose-100">
                        <p className="text-[9px] font-black uppercase text-rose-400 mb-1">Due USD</p>
                        <h4 className="text-2xl font-black text-rose-700 tracking-tighter">{finance.totalReceivablesUSD.toLocaleString()}</h4>
                     </div>
                     <div className="p-6 bg-white rounded-3xl border border-rose-100">
                        <p className="text-[9px] font-black uppercase text-rose-400 mb-1">Due EGP</p>
                        <h4 className="text-2xl font-black text-rose-700 tracking-tighter">{finance.totalReceivablesEGP.toLocaleString()}</h4>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Reports;
