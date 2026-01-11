
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Calendar, Printer, Bed, Zap, Search, 
  ShoppingCart, Percent, Building2, Wallet, Layers, 
  Landmark, Coins, Smartphone, Calculator, AlertCircle, ArrowRight,
  FileSpreadsheet, CheckCircle, Clock, Download, Activity, PieChart
} from 'lucide-react';
import { AppState, Booking, Expense, Currency } from '../types';
import { USD_TO_EGP_RATE, PLATFORMS, PAYMENT_METHODS } from '../constants';

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
      byPaymentMethod: {} as Record<string, { collected: number, receivable: number }>,
      byUnit: {} as Record<string, { revenue: number, services: number, expenses: number, commissionsPaid: number, commissionsDue: number, net: number, nights: number, bookings: number }>,
      totalGrossRevenue: 0,
      totalExpenses: 0,
      totalCommissionsPaid: 0,
      totalCommissionsDue: 0,
      totalServices: 0,
      totalReceivables: 0,
      totalAvailableNights: state.apartments.length * rangeDays,
      totalSoldNights: 0
    };

    // Init data structures
    state.apartments.forEach(a => {
      data.byUnit[a.id] = { revenue: 0, services: 0, expenses: 0, commissionsPaid: 0, commissionsDue: 0, net: 0, nights: 0, bookings: 0 };
    });
    PAYMENT_METHODS.forEach(m => data.byPaymentMethod[m] = { collected: 0, receivable: 0 });

    // A. Process All Bookings (Revenue & Commissions)
    state.bookings.filter(b => b.status !== 'cancelled' && b.status !== 'maintenance' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      const rate = b.currency === 'USD' ? USD_TO_EGP_RATE : 1;
      const totalValueEGP = b.totalAmount * rate;
      const collectedEGP = b.paidAmount * rate;
      const dueEGP = totalValueEGP - collectedEGP;
      const commissionEGP = b.commissionAmount * rate;
      
      const nights = Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)));
      
      data.totalGrossRevenue += totalValueEGP;
      data.totalReceivables += dueEGP;
      data.totalSoldNights += nights;

      if (b.commissionPaid) data.totalCommissionsPaid += commissionEGP;
      else data.totalCommissionsDue += commissionEGP;

      // Treasury Method tracking
      if (data.byPaymentMethod[b.paymentMethod]) {
        data.byPaymentMethod[b.paymentMethod].collected += collectedEGP;
        data.byPaymentMethod[b.paymentMethod].receivable += dueEGP;
      }

      // Services calculation
      const baseServicesEGP = b.services.reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0) * rate;
      const extraServicesEGP = (b.extraServices || []).reduce((acc, es) => acc + (es.isPaid ? es.price : 0), 0) * rate;
      const servicesTotalEGP = baseServicesEGP + extraServicesEGP;
      data.totalServices += servicesTotalEGP;

      // Unit Logic
      if (data.byUnit[b.apartmentId]) {
        data.byUnit[b.apartmentId].revenue += (totalValueEGP - servicesTotalEGP);
        data.byUnit[b.apartmentId].services += servicesTotalEGP;
        if (b.commissionPaid) data.byUnit[b.apartmentId].commissionsPaid += commissionEGP;
        else data.byUnit[b.apartmentId].commissionsDue += commissionEGP;
        data.byUnit[b.apartmentId].bookings += 1;
        data.byUnit[b.apartmentId].nights += nights;
      }

      // Add To Ledger
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
        amountEGP: collectedEGP,
        receivableEGP: dueEGP,
        commissionEGP: commissionEGP,
        commPaid: b.commissionPaid,
        status: dueEGP === 0 ? 'Settled' : 'Partial'
      });
    });

    // B. Process Operational Expenses
    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      const rate = e.currency === 'USD' ? USD_TO_EGP_RATE : 1;
      const amountEGP = e.amount * rate;
      
      if (e.category !== 'commission') {
         data.totalExpenses += amountEGP;
         if (e.apartmentId && data.byUnit[e.apartmentId]) {
           data.byUnit[e.apartmentId].expenses += amountEGP;
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
        amountEGP: amountEGP,
        receivableEGP: 0,
        commissionEGP: 0,
        status: 'Paid'
      });
    });

    // Final Unit Profit calculation (Revenue + Services - Expenses - Commissions)
    Object.keys(data.byUnit).forEach(id => {
      const u = data.byUnit[id];
      u.net = (u.revenue + u.services) - u.expenses - (u.commissionsPaid + u.commissionsDue);
    });

    return data;
  }, [state, dateRange]);

  const kpis = useMemo(() => {
    const netProfit = finance.totalGrossRevenue - finance.totalExpenses - (finance.totalCommissionsPaid + finance.totalCommissionsDue);
    const adr = finance.totalSoldNights > 0 ? (finance.totalGrossRevenue - finance.totalServices) / finance.totalSoldNights : 0;
    const occupancy = finance.totalAvailableNights > 0 ? (finance.totalSoldNights / finance.totalAvailableNights * 100).toFixed(1) : 0;
    const revpar = finance.totalAvailableNights > 0 ? (finance.totalGrossRevenue - finance.totalServices) / finance.totalAvailableNights : 0;

    return { netProfit, adr, occupancy, revpar };
  }, [finance]);

  // Export to CSV Function
  const exportToCSV = (tableName: string, rows: any[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_${tableName}_${dateRange.start}_to_${dateRange.end}.csv`;
    link.click();
  };

  const handlePrint = () => { window.print(); };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 font-bold">
      {/* 1. Master Accounting Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-slate-950 flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <Calculator className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Accounting Console</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> BAHIA HURGHADA LEDGER V16.5
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
          <button onClick={handlePrint} className="p-3 bg-slate-950 text-white rounded-2xl hover:bg-sky-600 transition-all shadow-lg">
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Professional KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Gross Revenue (EGP Eq.)</p>
            <h3 className="text-4xl font-black tracking-tighter">{finance.totalGrossRevenue.toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            <div className="mt-4 flex items-center gap-2 text-[9px] uppercase opacity-50">
               <Bed className="w-3 h-3" /> {(finance.totalGrossRevenue - finance.totalServices).toLocaleString()} Stays
               <span className="mx-1">•</span>
               <Zap className="w-3 h-3" /> {finance.totalServices.toLocaleString()} Services
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Commissions Detail</p>
            <h3 className="text-3xl font-black tracking-tighter text-slate-900">{(finance.totalCommissionsPaid + finance.totalCommissionsDue).toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            <div className="mt-4 flex flex-col gap-1 text-[9px] uppercase">
               <span className="text-emerald-500 font-black flex justify-between">Paid: <span>{finance.totalCommissionsPaid.toLocaleString()}</span></span>
               <span className="text-amber-500 font-black flex justify-between">Due: <span>{finance.totalCommissionsDue.toLocaleString()}</span></span>
            </div>
         </div>

         <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart className="w-24 h-24" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Net Bottom Line</p>
            <h3 className="text-4xl font-black tracking-tighter">{kpis.netProfit.toLocaleString()} <span className="text-xs opacity-30 uppercase">EGP</span></h3>
            <p className="mt-4 text-[9px] uppercase font-black px-2 py-1 bg-white/20 rounded-lg w-fit">Margin: {((kpis.netProfit / (finance.totalGrossRevenue || 1)) * 100).toFixed(1)}%</p>
         </div>

         <div className="bg-sky-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">RevPAR / ADR</p>
            <div className="flex items-baseline gap-2">
               <h3 className="text-4xl font-black tracking-tighter">{Math.round(kpis.revpar).toLocaleString()} <span className="text-[9px] opacity-50">EGP</span></h3>
            </div>
            <p className="mt-4 text-[9px] uppercase font-black">ADR: {Math.round(kpis.adr).toLocaleString()} EGP • Occ: {kpis.occupancy}%</p>
         </div>
      </div>

      {/* 3. Tab System Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 rounded-[2rem] w-fit mx-auto shadow-sm no-print">
         {[
           {id: 'TREASURY', label: 'Cash Flow', icon: Wallet},
           {id: 'UNITS', label: 'Unit Analysis', icon: Building2},
           {id: 'LEDGER', label: 'Master Ledger', icon: Layers},
           {id: 'EXPENSES', label: 'Outflows', icon: ShoppingCart}
         ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
               <t.icon className="w-4 h-4" /> {t.label}
            </button>
         ))}
      </div>

      {/* 4. Tab Content Rendering */}
      {activeTab === 'TREASURY' && (
         <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Liquidity Matrix */}
               <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Landmark className="w-6 h-6" /></div>
                       <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Liquid Cash by Method</h3>
                    </div>
                    <button onClick={() => exportToCSV('treasury', Object.keys(finance.byPaymentMethod).map(m => ({Method: m, ...finance.byPaymentMethod[m]})))} className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all no-print">
                       <FileSpreadsheet className="w-4 h-4" /> <span className="text-[10px] uppercase font-black">CSV</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {PAYMENT_METHODS.map(method => {
                        const stats = finance.byPaymentMethod[method];
                        if (!stats || (stats.collected === 0 && stats.receivable === 0)) return null;
                        const percentage = finance.totalGrossRevenue > 0 ? ((stats.collected / (finance.totalGrossRevenue - finance.totalReceivables || 1)) * 100).toFixed(0) : 0;
                        return (
                           <div key={method} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-sky-500 transition-all">
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                       {method === 'Cash' ? <Coins className="w-4 h-4 text-amber-500" /> : <Landmark className="w-4 h-4 text-sky-500" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{method}</span>
                                 </div>
                                 <span className="text-xs font-black text-slate-300">{percentage}%</span>
                              </div>
                              <div className="space-y-2">
                                 <div className="flex justify-between items-end">
                                    <p className="text-2xl font-black text-slate-950">{stats.collected.toLocaleString()} <span className="text-[10px] opacity-30">EGP</span></p>
                                    <span className="text-[8px] uppercase font-black text-emerald-500">Collected</span>
                                 </div>
                                 <div className="flex justify-between items-end border-t pt-2 mt-2">
                                    <p className="text-sm font-black text-rose-400">{stats.receivable.toLocaleString()} <span className="text-[10px]">EGP</span></p>
                                    <span className="text-[8px] uppercase font-black text-rose-300">Uncollected</span>
                                 </div>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </div>

               {/* Debtors & Receivables Panel */}
               <div className="bg-rose-50 rounded-[3rem] border-2 border-rose-100 p-10 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-200"><AlertCircle className="w-6 h-6" /></div>
                     <h3 className="text-xl font-black uppercase text-rose-950 tracking-tighter">Receivables Alert</h3>
                  </div>
                  <div className="space-y-4">
                     <div className="p-6 bg-white rounded-3xl border border-rose-100">
                        <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1">Total Outstanding</p>
                        <h4 className="text-4xl font-black text-rose-700 tracking-tighter">{finance.totalReceivables.toLocaleString()} <span className="text-xs opacity-50">EGP</span></h4>
                     </div>
                     <p className="text-[11px] font-bold text-rose-900/60 leading-relaxed italic border-l-4 border-rose-300 pl-4">
                       "Total amount due from active or upcoming bookings. Ensure payment collection upon arrival for better liquidity."
                     </p>
                  </div>
                  <div className="pt-6 border-t border-rose-200">
                     <button onClick={() => setActiveTab('LEDGER')} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-xl flex items-center justify-center gap-3">
                        Analyze Due Records <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'UNITS' && (
         <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 no-print">
               <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Separate Unit Performance Reports</h3>
               <button onClick={() => exportToCSV('units', Object.keys(finance.byUnit).map(id => ({Unit: state.apartments.find(a => a.id === id)?.unitNumber, ...finance.byUnit[id]})))} className="flex items-center gap-2 bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                  <Download className="w-4 h-4" /> Export Unit CSV
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {state.apartments.map(apt => {
                  const stats = finance.byUnit[apt.id] || { revenue: 0, services: 0, expenses: 0, commissionsPaid: 0, commissionsDue: 0, net: 0, bookings: 0, nights: 0 };
                  return (
                     <div key={apt.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-950 transition-all group">
                        <div className="p-8 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5"><Building2 className="w-16 h-16" /></div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Profitability Report</p>
                              <h4 className="text-3xl font-black tracking-tighter uppercase">Unit {apt.unitNumber}</h4>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Nights Sold</p>
                              <p className="text-2xl font-black">{stats.nights}</p>
                           </div>
                        </div>
                        <div className="p-8 space-y-6 flex-1 bg-white">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Accommodation</p>
                                 <p className="text-sm font-black text-slate-900">{stats.revenue.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></p>
                              </div>
                              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                                 <p className="text-[8px] font-black text-sky-600 uppercase mb-1">Amenities</p>
                                 <p className="text-sm font-black text-sky-950">{stats.services.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></p>
                              </div>
                              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                 <p className="text-[8px] font-black text-rose-600 uppercase mb-1">Direct Expenses</p>
                                 <p className="text-sm font-black text-rose-950">-{stats.expenses.toLocaleString()}</p>
                              </div>
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                 <p className="text-[8px] font-black text-amber-600 uppercase mb-1">Total Comm.</p>
                                 <p className="text-sm font-black text-amber-950">-{ (stats.commissionsPaid + stats.commissionsDue).toLocaleString() }</p>
                              </div>
                           </div>
                           <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Unit Net Profit</span>
                              <span className={`text-2xl font-black ${stats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{stats.net.toLocaleString()} EGP</span>
                           </div>
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>
      )}

      {activeTab === 'LEDGER' && (
         <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
               <div className="flex items-center gap-4">
                  <Layers className="w-6 h-6 text-slate-950" />
                  <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Consolidated Master Ledger</h3>
               </div>
               <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input placeholder="Filter by Ref, Unit, Guest..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 text-xs" value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} />
                  </div>
                  <button onClick={() => exportToCSV('ledger', finance.transactions)} className="p-4 bg-slate-950 text-white rounded-2xl shadow-xl hover:bg-sky-600 transition-all">
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left font-bold">
                  <thead>
                     <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Classification</th>
                        <th className="px-8 py-5">Ref / Source</th>
                        <th className="px-8 py-5">Method</th>
                        <th className="px-8 py-5 text-right">Inflow (EGP)</th>
                        <th className="px-8 py-5 text-right text-rose-400">Due/Comm.</th>
                        <th className="px-8 py-5 text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {finance.transactions.filter(t => t.ref.toLowerCase().includes(ledgerSearch.toLowerCase()) || t.entity.toLowerCase().includes(ledgerSearch.toLowerCase()) || t.unit?.toLowerCase().includes(ledgerSearch.toLowerCase())).map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all text-[11px]">
                           <td className="px-8 py-5 text-slate-400 font-medium">{t.date}</td>
                           <td className="px-8 py-5">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${t.type === 'INFLOW' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                 {t.category}
                              </span>
                           </td>
                           <td className="px-8 py-5">
                              <p className="font-black text-slate-900 uppercase">{t.ref}</p>
                              <p className="text-[8px] text-sky-600 font-black uppercase tracking-widest">U-{t.unit || 'GEN'}</p>
                           </td>
                           <td className="px-8 py-5 text-slate-500 uppercase text-[9px]">{t.method}</td>
                           <td className={`px-8 py-5 text-right font-black ${t.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.type === 'INFLOW' ? '+' : '-'}{t.amountEGP.toLocaleString()}
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex flex-col items-end">
                                 {t.receivableEGP > 0 && <span className="text-rose-400 font-black">{t.receivableEGP.toLocaleString()} due</span>}
                                 {t.commissionEGP > 0 && <span className={`${t.commPaid ? 'text-emerald-500' : 'text-amber-500'} text-[8px] font-black uppercase`}>{t.commissionEGP.toLocaleString()} {t.commPaid ? 'comm. paid' : 'comm. due'}</span>}
                                 {t.receivableEGP === 0 && t.commissionEGP === 0 && <span className="text-slate-200">—</span>}
                              </div>
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

      {activeTab === 'EXPENSES' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ShoppingCart className="w-6 h-6" /></div>
                     <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Operational Cost Centers</h3>
                  </div>
                  <button onClick={() => exportToCSV('expenses', finance.transactions.filter(t => t.type === 'OUTFLOW'))} className="p-3 bg-slate-900 text-white rounded-xl no-print">
                     <Download className="w-4 h-4" />
                  </button>
               </div>
               <div className="space-y-6">
                  {['MAINTENANCE', 'SUPPLIES', 'UTILITY', 'OTHER'].map(cat => {
                     const catSum = finance.transactions
                        .filter(t => t.type === 'OUTFLOW' && t.category === cat)
                        .reduce((acc, curr) => acc + curr.amountEGP, 0);
                     const percentage = finance.totalExpenses > 0 ? (catSum / finance.totalExpenses * 100).toFixed(0) : 0;
                     if (catSum === 0) return null;
                     return (
                        <div key={cat} className="space-y-3">
                           <div className="flex justify-between items-center px-2">
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{cat}</span>
                              <span className="text-sm font-black text-slate-950">{catSum.toLocaleString()} EGP <span className="text-[10px] text-slate-400 ml-2">({percentage}%)</span></span>
                           </div>
                           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500" style={{width: `${percentage}%`}}></div>
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>
            
            <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp className="w-40 h-40" /></div>
               <h3 className="text-2xl font-black uppercase tracking-tighter text-sky-400">Profit Maximization Engine</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/10">
                     <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 shadow-xl"><Activity className="w-6 h-6" /></div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Efficiency Rating</p>
                        <p className="text-2xl font-black">{(kpis.netProfit / (finance.totalGrossRevenue || 1) * 100).toFixed(1)}%</p>
                     </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                     <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic border-l-4 border-sky-500 pl-4 uppercase">
                        "Total Commissions account for {(((finance.totalCommissionsPaid + finance.totalCommissionsDue) / (finance.totalGrossRevenue || 1)) * 100).toFixed(1)}% of your gross revenue."
                     </p>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Reports;
