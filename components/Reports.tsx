
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Calendar, Printer, Bed, Zap, Search, 
  ShoppingCart, Percent, Building2, Wallet, Layers, 
  Landmark, Coins, Smartphone, Calculator, AlertCircle, ArrowRight,
  FileSpreadsheet, CheckCircle, Clock, Download, Activity, PieChart, DollarSign, Filter, X, RefreshCw, ArrowLeftRight, UserCheck, BarChart3, Radio
} from 'lucide-react';
import { AppState, Booking, Expense, Currency } from '../types';
import { PAYMENT_METHODS, PLATFORMS } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'TREASURY' | 'UNITS' | 'CHANNELS' | 'SERVICES' | 'EXPENSES' | 'LIVE_OPS' | 'LEDGER'>('TREASURY');
  const [search, setSearch] = useState('');

  // --- المحرك المالي الاحترافي ---
  const finance = useMemo(() => {
    const data = {
      transactions: [] as any[],
      unitStats: {} as Record<string, { stayRev: number, nights: number, bookings: number, exp: number }>,
      channelStats: {} as Record<string, { revenue: number, count: number }>,
      serviceStats: { total: 0, items: [] as any[] },
      expenseStats: { total: 0, items: [] as any[] },
      treasury: {} as Record<string, { egp: number, usd: number }>,
      liveOps: [] as any[],
      totalGrossEGP: 0,
      totalGrossUSD: 0
    };

    // تهيئة البيانات
    state.apartments.forEach(a => data.unitStats[a.id] = { stayRev: 0, nights: 0, bookings: 0, exp: 0 });
    PLATFORMS.forEach(p => data.channelStats[p] = { revenue: 0, count: 0 });
    PAYMENT_METHODS.forEach(m => data.treasury[m] = { egp: 0, usd: 0 });

    const now = new Date();
    const next48h = new Date(now.getTime() + (48 * 60 * 60 * 1000)).toISOString().split('T')[0];

    // 1. معالجة الحجوزات
    state.bookings.forEach(b => {
      const isCancelled = b.status === 'cancelled' || b.status === 'maintenance';
      const inDateRange = b.startDate >= dateRange.start && b.startDate <= dateRange.end;
      const isUSD = b.currency === 'USD';
      const rate = b.exchangeRateAtBooking || state.currentExchangeRate || 50;

      // أداء العمليات الحية (48 ساعة)
      if (!isCancelled) {
        if (b.startDate <= next48h && b.startDate >= now.toISOString().split('T')[0]) {
          data.liveOps.push({ type: 'Arrival', guest: state.customers.find(c => c.id === b.customerId)?.name, unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber, date: b.startDate, status: b.status });
        }
        if (b.endDate <= next48h && b.endDate >= now.toISOString().split('T')[0]) {
          data.liveOps.push({ type: 'Departure', guest: state.customers.find(c => c.id === b.customerId)?.name, unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber, date: b.endDate, status: b.status });
        }
      }

      if (isCancelled || !inDateRange) return;

      // حساب صافي دخل الإقامة (Normalized EGP)
      const serviceEGP = (b.services || []).reduce((acc, sid) => acc + (state.services.find(s => s.id === sid)?.price || 0), 0) + 
                         (b.extraServices || []).reduce((acc, es) => acc + es.price, 0);
      
      const totalEGP = isUSD ? b.totalAmount * rate : b.totalAmount;
      const stayRevEGP = Math.max(0, totalEGP - serviceEGP);

      // تحديث إحصائيات الوحدات
      if (data.unitStats[b.apartmentId]) {
        const u = data.unitStats[b.apartmentId];
        u.stayRev += stayRevEGP;
        u.bookings += 1;
        u.nights += Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)));
      }

      // تحديث تحليلات القنوات
      if (data.channelStats[b.platform]) {
        data.channelStats[b.platform].revenue += totalEGP;
        data.channelStats[b.platform].count += 1;
      }

      // الخزينة (المبالغ المدفوعة فعلياً)
      if (data.treasury[b.paymentMethod]) {
        if (isUSD) data.treasury[b.paymentMethod].usd += b.paidAmount;
        else data.treasury[b.paymentMethod].egp += b.paidAmount;
      }

      // إيرادات الخدمات
      if (serviceEGP > 0) {
        data.serviceStats.total += serviceEGP;
        data.serviceStats.items.push({ date: b.startDate, guest: state.customers.find(c => c.id === b.customerId)?.name, unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber, amount: serviceEGP, ref: b.displayId });
      }

      // الإجمالي العام
      if (isUSD) data.totalGrossUSD += b.totalAmount;
      else data.totalGrossEGP += b.totalAmount;

      data.transactions.push({ date: b.startDate, ref: b.displayId, entity: state.customers.find(c => c.id === b.customerId)?.name, type: 'IN', amount: b.paidAmount, currency: b.currency, unit: state.apartments.find(a => a.id === b.apartmentId)?.unitNumber });
    });

    // 2. معالجة المصاريف
    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      const rate = state.currentExchangeRate || 50;
      const amountEGP = e.currency === 'USD' ? e.amount * rate : e.amount;
      
      data.expenseStats.total += amountEGP;
      data.expenseStats.items.push({ date: e.date, desc: e.description, cat: e.category, unit: e.apartmentId ? state.apartments.find(a => a.id === e.apartmentId)?.unitNumber : 'General', amount: e.amount, currency: e.currency });

      if (e.apartmentId && data.unitStats[e.apartmentId]) {
        data.unitStats[e.apartmentId].exp += amountEGP;
      }

      data.transactions.push({ date: e.date, ref: e.description, entity: 'Operational', type: 'OUT', amount: e.amount, currency: e.currency, unit: e.apartmentId ? state.apartments.find(a => a.id === e.apartmentId)?.unitNumber : 'General' });
    });

    return data;
  }, [state, dateRange]);

  // --- دالة تصدير CSV ---
  const exportCSV = (type: string, headers: string[], rows: any[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_${type}_${dateRange.start}_to_${dateRange.end}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 font-bold">
      {/* Header & Filter */}
      <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border-b-8 border-slate-950 flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <BarChart3 className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Intelligence Engine</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> BAHIA AUDIT V22.5 • PRO TABLES
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
          <button onClick={() => window.print()} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-sky-500 transition-all">
            <Printer className="w-4 h-4" /> Print Full Report
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-2 bg-white border border-slate-200 rounded-[2.5rem] w-fit mx-auto shadow-sm no-print">
         {[
           { id: 'TREASURY', label: 'Treasury (Paid)', icon: Wallet },
           { id: 'UNITS', label: 'Unit Profits', icon: Building2 },
           { id: 'CHANNELS', label: 'Channel Analytics', icon: Radio },
           { id: 'SERVICES', label: 'Amenity Rev', icon: Zap },
           { id: 'EXPENSES', label: 'Expense Ledger', icon: ShoppingCart },
           { id: 'LIVE_OPS', label: 'Live Ops (48h)', icon: Activity },
           { id: 'LEDGER', label: 'Master Journal', icon: Layers }
         ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-950 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
               <t.icon className="w-4 h-4" /> {t.label}
            </button>
         ))}
      </div>

      {/* Tab Content Areas */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
         
         {/* تبويب الخزينة */}
         {activeTab === 'TREASURY' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Treasury Cashflow Table</h3>
                  <button onClick={() => exportCSV('treasury', ['Method', 'USD', 'EGP'], Object.entries(finance.treasury).map(([k,v]) => [k, v.usd, v.egp]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Payment Method</th>
                           <th className="px-10 py-6 text-right">USD Collected</th>
                           <th className="px-10 py-6 text-right">EGP Collected</th>
                           <th className="px-10 py-6 text-right">Total (Normalized EGP)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {Object.entries(finance.treasury).map(([method, val]) => (
                           <tr key={method} className="hover:bg-slate-50 transition-all text-xs">
                              <td className="px-10 py-6 uppercase">{method}</td>
                              <td className="px-10 py-6 text-right text-sky-600">{val.usd.toLocaleString()} <span className="text-[9px] opacity-40">USD</span></td>
                              <td className="px-10 py-6 text-right text-emerald-600">{val.egp.toLocaleString()} <span className="text-[9px] opacity-40">EGP</span></td>
                              <td className="px-10 py-6 text-right text-slate-950">{(val.egp + (val.usd * (state.currentExchangeRate || 50))).toLocaleString()} EGP</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* تبويب أرباح الوحدات */}
         {activeTab === 'UNITS' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Unit Profitability Matrix</h3>
                  <button onClick={() => exportCSV('unit_profits', ['Unit', 'Bookings', 'Nights', 'StayRevenue', 'Expenses', 'Net'], state.apartments.map(a => [a.unitNumber, finance.unitStats[a.id].bookings, finance.unitStats[a.id].nights, finance.unitStats[a.id].stayRev, finance.unitStats[a.id].exp, (finance.unitStats[a.id].stayRev - finance.unitStats[a.id].exp)]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Unit #</th>
                           <th className="px-10 py-6">Bookings</th>
                           <th className="px-10 py-6">Total Nights</th>
                           <th className="px-10 py-6 text-right">Stay Revenue (EGP)</th>
                           <th className="px-10 py-6 text-right">Op Expenses (EGP)</th>
                           <th className="px-10 py-6 text-right">Net Profit</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {state.apartments.map(apt => {
                           const s = finance.unitStats[apt.id];
                           const net = s.stayRev - s.exp;
                           return (
                              <tr key={apt.id} className="hover:bg-slate-50 transition-all text-xs">
                                 <td className="px-10 py-6 uppercase font-black">U-{apt.unitNumber}</td>
                                 <td className="px-10 py-6">{s.bookings} Reserv.</td>
                                 <td className="px-10 py-6 text-sky-600">{s.nights} Nights</td>
                                 <td className="px-10 py-6 text-right text-emerald-600">{s.stayRev.toLocaleString()}</td>
                                 <td className="px-10 py-6 text-right text-rose-500">-{s.exp.toLocaleString()}</td>
                                 <td className={`px-10 py-6 text-right text-sm ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{net.toLocaleString()} EGP</td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* تبويب تحليلات القنوات (The Missing Analytics) */}
         {activeTab === 'CHANNELS' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Channel Performance Index</h3>
                  <button onClick={() => exportCSV('channels', ['Platform', 'Count', 'Revenue'], Object.entries(finance.channelStats).map(([k,v]) => [k, v.count, v.revenue]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Booking Platform</th>
                           <th className="px-10 py-6">Folio Count</th>
                           <th className="px-10 py-6 text-right">Total Revenue (EGP)</th>
                           <th className="px-10 py-6 text-right">Contribution %</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {Object.entries(finance.channelStats).map(([platform, val]) => {
                           const totalGlobal = Object.values(finance.channelStats).reduce((acc, v) => acc + v.revenue, 0);
                           const percent = totalGlobal > 0 ? ((val.revenue / totalGlobal) * 100).toFixed(1) : 0;
                           return (
                              <tr key={platform} className="hover:bg-slate-50 transition-all text-xs">
                                 <td className="px-10 py-6 uppercase">{platform}</td>
                                 <td className="px-10 py-6 font-black">{val.count} Folios</td>
                                 <td className="px-10 py-6 text-right text-sky-600">{val.revenue.toLocaleString()} EGP</td>
                                 <td className="px-10 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                       <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-sky-500" style={{ width: `${percent}%` }}></div>
                                       </div>
                                       <span>{percent}%</span>
                                    </div>
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* تبويب إيرادات الخدمات */}
         {activeTab === 'SERVICES' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Amenity & Upsell Journal</h3>
                  <button onClick={() => exportCSV('services', ['Date', 'Guest', 'Unit', 'Amount'], finance.serviceStats.items.map(i => [i.date, i.guest, i.unit, i.amount]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Date</th>
                           <th className="px-10 py-6">Guest Profile</th>
                           <th className="px-10 py-6">Origin Unit</th>
                           <th className="px-10 py-6 text-right">Service Total (EGP)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {finance.serviceStats.items.map((item, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-xs">
                              <td className="px-10 py-6 text-slate-400">{item.date}</td>
                              <td className="px-10 py-6 uppercase">{item.guest}</td>
                              <td className="px-10 py-6 font-black text-sky-600">U-{item.unit}</td>
                              <td className="px-10 py-6 text-right text-emerald-600">{item.amount.toLocaleString()} EGP</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* تبويب المصاريف */}
         {activeTab === 'EXPENSES' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Operational Expenditure Log</h3>
                  <button onClick={() => exportCSV('expenses', ['Date', 'Description', 'Category', 'Unit', 'Amount', 'Currency'], finance.expenseStats.items.map(i => [i.date, i.desc, i.cat, i.unit, i.amount, i.currency]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Date</th>
                           <th className="px-10 py-6">Description</th>
                           <th className="px-10 py-6">Category</th>
                           <th className="px-10 py-6">Target Unit</th>
                           <th className="px-10 py-6 text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {finance.expenseStats.items.map((e, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-xs">
                              <td className="px-10 py-6 text-slate-400">{e.date}</td>
                              <td className="px-10 py-6 uppercase font-black text-slate-950">{e.desc}</td>
                              <td className="px-10 py-6">
                                 <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] uppercase text-slate-500">{e.cat}</span>
                              </td>
                              <td className="px-10 py-6 font-black text-slate-400">{e.unit !== 'General' ? `U-${e.unit}` : 'General'}</td>
                              <td className="px-10 py-6 text-right text-rose-500 font-black">-{e.amount.toLocaleString()} <span className="text-[9px] opacity-40">{e.currency}</span></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* تبويب العمليات الحية (The Missing Live Ops 48h) */}
         {activeTab === 'LIVE_OPS' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-sky-600 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Radio className="w-6 h-6 animate-pulse"/> 48-Hour Tactical Briefing</h3>
                  <button onClick={() => exportCSV('live_ops', ['Type', 'Guest', 'Unit', 'Date', 'Status'], finance.liveOps.map(i => [i.type, i.guest, i.unit, i.date, i.status]))} className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-slate-950 transition-all flex items-center gap-2"><Download className="w-3 h-3"/> Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Event Type</th>
                           <th className="px-10 py-6">Guest Identity</th>
                           <th className="px-10 py-6">Unit #</th>
                           <th className="px-10 py-6">Scheduled Date</th>
                           <th className="px-10 py-6 text-right">System Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {finance.liveOps.map((op, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-xs">
                              <td className="px-10 py-6">
                                 <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${op.type === 'Arrival' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                    {op.type}
                                 </span>
                              </td>
                              <td className="px-10 py-6 uppercase">{op.guest}</td>
                              <td className="px-10 py-6 font-black text-sky-600 uppercase">U-{op.unit}</td>
                              <td className="px-10 py-6 text-slate-400 font-bold">{op.date}</td>
                              <td className="px-10 py-6 text-right uppercase text-[10px] font-black text-slate-400">{op.status}</td>
                           </tr>
                        ))}
                        {finance.liveOps.length === 0 && (
                           <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No Tactical Events in Next 48h</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* تبويب دفتر الأستاذ العام */}
         {activeTab === 'LEDGER' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
                  <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Master Financial Journal</h3>
                  <div className="flex items-center gap-4">
                     <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input placeholder="Search Journal..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-[10px]" value={search} onChange={e => setSearch(e.target.value)} />
                     </div>
                     <button onClick={() => exportCSV('master_ledger', ['Date', 'Ref', 'Entity', 'Unit', 'Type', 'Amount', 'Currency'], finance.transactions.map(i => [i.date, i.ref, i.entity, i.unit, i.type, i.amount, i.currency]))} className="p-3 bg-slate-950 text-white rounded-xl hover:bg-sky-600 transition-all shadow-md"><Download className="w-5 h-5"/></button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                           <th className="px-10 py-6">Timestamp</th>
                           <th className="px-10 py-6">Reference / Source</th>
                           <th className="px-10 py-6">Entity</th>
                           <th className="px-10 py-6">Unit #</th>
                           <th className="px-10 py-6 text-right">In/Out Value</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {finance.transactions.filter(t => t.ref.toLowerCase().includes(search.toLowerCase()) || t.entity.toLowerCase().includes(search.toLowerCase())).map((t, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-all text-xs">
                              <td className="px-10 py-6 text-slate-400">{t.date}</td>
                              <td className="px-10 py-6 uppercase font-black text-slate-950">{t.ref}</td>
                              <td className="px-10 py-6 uppercase font-bold text-slate-400">{t.entity}</td>
                              <td className="px-10 py-6 font-black text-sky-600">U-{t.unit}</td>
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
