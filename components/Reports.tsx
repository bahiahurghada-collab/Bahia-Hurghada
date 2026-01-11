
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Calendar, Printer, Bed, Zap, Search, 
  ShoppingCart, Percent, Building2, Wallet, Layers, 
  Landmark, Coins, Smartphone, Calculator, AlertCircle, ArrowRight,
  FileSpreadsheet, CheckCircle, Clock, Download, Activity, PieChart, DollarSign
} from 'lucide-react';
import { AppState, Booking, Expense, Currency } from '../types';
import { PAYMENT_METHODS } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'TREASURY' | 'UNITS' | 'LEDGER' | 'EXPENSES'>('TREASURY');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // 1. Core Accounting Engine
  const finance = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const rangeDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const data = {
      transactions: [] as any[],
      byPaymentMethod: {} as Record<string, { collectedEGP: number, collectedUSD: number, receivableEGP: number, receivableUSD: number }>,
      byUnit: {} as Record<string, { revenueEGP: number, revenueUSD: number, servicesEGP: number, servicesUSD: number, expensesEGP: number, expensesUSD: number, commPaidEGP: number, commPaidUSD: number, commDueEGP: number, commDueUSD: number, netEGP: number, nights: number, bookings: number }>,
      totalGrossEGP: 0,
      totalGrossUSD: 0,
      totalExpEGP: 0,
      totalExpUSD: 0,
      totalCommPaidEGP: 0,
      totalCommPaidUSD: 0,
      totalCommDueEGP: 0,
      totalCommDueUSD: 0,
      totalServicesEGP: 0,
      totalServicesUSD: 0,
      totalReceivablesEGP: 0,
      totalReceivablesUSD: 0,
      totalAvailableNights: state.apartments.length * rangeDays,
      totalSoldNights: 0
    };

    // Init data structures
    state.apartments.forEach(a => {
      data.byUnit[a.id] = { revenueEGP: 0, revenueUSD: 0, servicesEGP: 0, servicesUSD: 0, expensesEGP: 0, expensesUSD: 0, commPaidEGP: 0, commPaidUSD: 0, commDueEGP: 0, commDueUSD: 0, netEGP: 0, nights: 0, bookings: 0 };
    });
    PAYMENT_METHODS.forEach(m => data.byPaymentMethod[m] = { collectedEGP: 0, collectedUSD: 0, receivableEGP: 0, receivableUSD: 0 });

    // A. Process All Bookings
    state.bookings.filter(b => b.status !== 'cancelled' && b.status !== 'maintenance' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      const isUSD = b.currency === 'USD';
      const rate = b.exchangeRateAtBooking || state.currentExchangeRate;
      
      const totalVal = b.totalAmount;
      const collected = b.paidAmount;
      const due = totalVal - collected;
      const comm = b.commissionAmount;
      
      const nights = Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)));
      
      if (isUSD) {
        data.totalGrossUSD += totalVal;
        data.totalReceivablesUSD += due;
        if (b.commissionPaid) data.totalCommPaidUSD += comm;
        else data.totalCommDueUSD += comm;
      } else {
        data.totalGrossEGP += totalVal;
        data.totalReceivablesEGP += due;
        if (b.commissionPaid) data.totalCommPaidEGP += comm;
        else data.totalCommDueEGP += comm;
      }
      
      data.totalSoldNights += nights;

      // Treasury
      if (data.byPaymentMethod[b.paymentMethod]) {
        if (isUSD) {
          data.byPaymentMethod[b.paymentMethod].collectedUSD += collected;
          data.byPaymentMethod[b.paymentMethod].receivableUSD += due;
        } else {
          data.byPaymentMethod[b.paymentMethod].collectedEGP += collected;
          data.byPaymentMethod[b.paymentMethod].receivableEGP += due;
        }
      }

      // Services
      const baseServices = b.services.reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0);
      const extraServices = (b.extraServices || []).reduce((acc, es) => acc + (es.isPaid ? es.price : 0), 0);
      const servTotal = baseServices + extraServices;
      
      if (isUSD) data.totalServicesUSD += servTotal;
      else data.totalServicesEGP += servTotal;

      // Unit Logic
      if (data.byUnit[b.apartmentId]) {
        const u = data.byUnit[b.apartmentId];
        if (isUSD) {
          u.revenueUSD += (totalVal - servTotal);
          u.servicesUSD += servTotal;
          if (b.commissionPaid) u.commPaidUSD += comm; else u.commDueUSD += comm;
        } else {
          u.revenueEGP += (totalVal - servTotal);
          u.servicesEGP += servTotal;
          if (b.commissionPaid) u.commPaidEGP += comm; else u.commDueEGP += comm;
        }
        u.bookings += 1;
        u.nights += nights;
      }

      // Ledger Entry
      data.transactions.push({
        date: b.startDate,
        type: 'INFLOW',
        category: 'Stay',
        ref: `${b.displayId}`,
        unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber,
        entity: state.customers.find(c => c.id === b.customerId)?.name || 'Walk-in',
        method: b.paymentMethod,
        amount: b.paidAmount,
        currency: b.currency,
        due: due,
        comm: comm,
        commPaid: b.commissionPaid,
        status: due === 0 ? 'Settled' : 'Partial'
      });
    });

    // B. Process Operational Expenses
    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      const isUSD = e.currency === 'USD';
      if (e.category !== 'commission') {
         if (isUSD) {
           data.totalExpUSD += e.amount;
           if (e.apartmentId && data.byUnit[e.apartmentId]) data.byUnit[e.apartmentId].expensesUSD += e.amount;
         } else {
           data.totalExpEGP += e.amount;
           if (e.apartmentId && data.byUnit[e.apartmentId]) data.byUnit[e.apartmentId].expensesEGP += e.amount;
         }
      }

      data.transactions.push({
        date: e.date,
        type: 'OUTFLOW',
        category: e.category.toUpperCase(),
        ref: e.description,
        unit: state.apartments.find(a => a.id === e.apartmentId)?.unitNumber || 'General',
        entity: 'Ops Supplier',
        method: 'Cash/Transfer',
        amount: e.amount,
        currency: e.currency,
        due: 0,
        comm: 0,
        status: 'Paid'
      });
    });

    // Final Unit Profit calculation (Normalized to EGP for comparison)
    Object.keys(data.byUnit).forEach(id => {
      const u = data.byUnit[id];
      const rate = state.currentExchangeRate;
      const netEGP = 
        ((u.revenueUSD + u.servicesUSD - u.expensesUSD - u.commPaidUSD - u.commDueUSD) * rate) +
        (u.revenueEGP + u.servicesEGP - u.expensesEGP - u.commPaidEGP - u.commDueEGP);
      u.netEGP = netEGP;
    });

    return data;
  }, [state, dateRange]);

  const kpis = useMemo(() => {
    const rate = state.currentExchangeRate;
    const totalGrossNormalized = finance.totalGrossEGP + (finance.totalGrossUSD * rate);
    const totalExpNormalized = finance.totalExpEGP + (finance.totalExpUSD * rate);
    const totalCommNormalized = (finance.totalCommPaidEGP + finance.totalCommDueEGP) + ((finance.totalCommPaidUSD + finance.totalCommDueUSD) * rate);
    const netProfitEGP = totalGrossNormalized - totalExpNormalized - totalCommNormalized;
    
    const adrEGP = finance.totalSoldNights > 0 ? (totalGrossNormalized - (finance.totalServicesEGP + (finance.totalServicesUSD * rate))) / finance.totalSoldNights : 0;
    const occupancy = finance.totalAvailableNights > 0 ? (finance.totalSoldNights / finance.totalAvailableNights * 100).toFixed(1) : 0;
    const revparEGP = finance.totalAvailableNights > 0 ? (totalGrossNormalized - (finance.totalServicesEGP + (finance.totalServicesUSD * rate))) / finance.totalAvailableNights : 0;

    return { netProfitEGP, adrEGP, occupancy, revparEGP, totalGrossNormalized };
  }, [finance, state.currentExchangeRate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 font-bold">
      {/* Accounting Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-slate-950 flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <Calculator className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Dual Currency Reports</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> BAHIA LEDGER V17.0 | Rate: {state.currentExchangeRate} EGP/USD
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
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-2">Dual Gross Revenue</p>
            <div className="space-y-1">
               <h3 className="text-3xl font-black tracking-tighter">{finance.totalGrossUSD.toLocaleString()} <span className="text-xs opacity-30 uppercase">USD</span></h3>
               <h3 className="text-3xl font-black tracking-tighter">{finance.totalGrossEGP.toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Commissions Breakdown</p>
            <div className="space-y-4">
               <div>
                  <p className="text-[8px] font-black uppercase text-slate-400">USD Track</p>
                  <p className="text-lg font-black text-sky-600">{(finance.totalCommPaidUSD + finance.totalCommDueUSD).toLocaleString()} USD</p>
               </div>
               <div>
                  <p className="text-[8px] font-black uppercase text-slate-400">EGP Track</p>
                  <p className="text-lg font-black text-emerald-600">{(finance.totalCommPaidEGP + finance.totalCommDueEGP).toLocaleString()} EGP</p>
               </div>
            </div>
         </div>

         <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart className="w-24 h-24" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Normalized Net (EGP)</p>
            <h3 className="text-4xl font-black tracking-tighter">{kpis.netProfitEGP.toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            <p className="mt-4 text-[9px] uppercase font-black px-2 py-1 bg-white/20 rounded-lg w-fit">Global Margin: {((kpis.netProfitEGP / (kpis.totalGrossNormalized || 1)) * 100).toFixed(1)}%</p>
         </div>

         <div className="bg-sky-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Occupancy & Performance</p>
            <h3 className="text-4xl font-black tracking-tighter">{kpis.occupancy}%</h3>
            <p className="mt-4 text-[9px] uppercase font-black">ADR: {Math.round(kpis.adrEGP).toLocaleString()} EGP • revpar: {Math.round(kpis.revparEGP).toLocaleString()} EGP</p>
         </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 rounded-[2rem] w-fit mx-auto shadow-sm no-print">
         {[
           {id: 'TREASURY', label: 'Cash Flow', icon: Wallet},
           {id: 'UNITS', label: 'Unit Analysis', icon: Building2},
           {id: 'LEDGER', label: 'Master Ledger', icon: Layers}
         ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
               <t.icon className="w-4 h-4" /> {t.label}
            </button>
         ))}
      </div>

      {activeTab === 'TREASURY' && (
         <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Landmark className="w-6 h-6" /></div>
                     <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Liquid Cash Matrix</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                     <h3 className="text-xl font-black uppercase text-rose-950 tracking-tighter">Dual Outstanding Balance</h3>
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
         </div>
      )}

      {activeTab === 'UNITS' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {state.apartments.map(apt => {
               // FIX: Providing a full default object to satisfy TypeScript and prevent access on '{}' for the unit stats
               const u = finance.byUnit[apt.id] || { 
                 revenueEGP: 0, revenueUSD: 0, servicesEGP: 0, servicesUSD: 0, 
                 expensesEGP: 0, expensesUSD: 0, commPaidEGP: 0, commPaidUSD: 0, 
                 commDueEGP: 0, commDueUSD: 0, netEGP: 0, nights: 0, bookings: 0 
               };
               return (
                  <div key={apt.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-slate-950 transition-all">
                     <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                        <h4 className="text-2xl font-black tracking-tighter uppercase">Unit {apt.unitNumber}</h4>
                        <div className="text-right">
                           <p className="text-[9px] font-black uppercase opacity-40">Profit EGP</p>
                           <p className="text-xl font-black text-emerald-400">{(u.netEGP || 0).toLocaleString()}</p>
                        </div>
                     </div>
                     <div className="p-8 space-y-4">
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-[10px] uppercase font-black text-slate-400">Revenue USD</span>
                           <span className="text-sm font-black text-sky-600">{u.revenueUSD || 0} USD</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-[10px] uppercase font-black text-slate-400">Revenue EGP</span>
                           <span className="text-sm font-black text-emerald-600">{u.revenueEGP || 0} EGP</span>
                        </div>
                        <div className="flex justify-between pt-2">
                           <span className="text-[10px] uppercase font-black text-slate-400">Nights / Bookings</span>
                           <span className="text-sm font-black text-slate-900">{u.nights || 0} / {u.bookings || 0}</span>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
      )}

      {activeTab === 'LEDGER' && (
         <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
               <div className="flex items-center gap-4">
                  <Layers className="w-6 h-6 text-slate-950" />
                  <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Dual Currency Master Ledger</h3>
               </div>
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input placeholder="Filter by Ref, Unit, Guest..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold" value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} />
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left font-bold">
                  <thead>
                     <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Ref / Unit</th>
                        <th className="px-8 py-5">Entity</th>
                        <th className="px-8 py-5 text-right">Original Amount</th>
                        <th className="px-8 py-5 text-right">Outstanding</th>
                        <th className="px-8 py-5 text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {finance.transactions.filter(t => t.ref.toLowerCase().includes(ledgerSearch.toLowerCase()) || t.entity.toLowerCase().includes(ledgerSearch.toLowerCase()) || t.unit?.toLowerCase().includes(ledgerSearch.toLowerCase())).map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all text-[11px]">
                           <td className="px-8 py-5 text-slate-400">{t.date}</td>
                           <td className="px-8 py-5 uppercase">
                              <p className="font-black text-slate-900">{t.ref}</p>
                              <p className="text-[8px] text-sky-600 font-black tracking-widest">U-{t.unit || 'GEN'}</p>
                           </td>
                           <td className="px-8 py-5 uppercase text-slate-500">{t.entity}</td>
                           <td className={`px-8 py-5 text-right font-black ${t.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.amount.toLocaleString()} <span className="text-[9px] opacity-40">{t.currency}</span>
                           </td>
                           <td className="px-8 py-5 text-right">
                              {t.due > 0 ? (
                                 <span className="text-rose-400 font-black">{t.due.toLocaleString()} {t.currency}</span>
                              ) : <span className="text-slate-200">—</span>}
                           </td>
                           <td className="px-8 py-5 text-center">
                              {t.status === 'Settled' ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <Clock className="w-4 h-4 text-amber-500 mx-auto" />}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}
    </div>
  );
};

export default Reports;
