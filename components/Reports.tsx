
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Scale, Calendar, Printer, Bed, Zap, FileText, Search, CreditCard, DollarSign, Globe
} from 'lucide-react';
import { AppState } from '../types';
import { USD_TO_EGP_RATE, PLATFORMS } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'CONSOLIDATED' | 'CHANNELS' | 'EXPENSE'>('CONSOLIDATED');

  const financialData = useMemo(() => {
    const inflow: any[] = [];
    const outflow: any[] = [];
    const channelSummary: Record<string, { revenue: number, count: number }> = {};
    
    PLATFORMS.forEach(p => channelSummary[p] = { revenue: 0, count: 0 });

    let totalAccommodationEGP = 0;
    let totalServicesEGP = 0;

    state.bookings.filter(b => b.status !== 'cancelled' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      const apt = state.apartments.find(a => a.id === b.apartmentId);
      const guest = state.customers.find(c => c.id === b.customerId);

      const paidEGP = b.paidAmount * (b.currency === 'USD' ? USD_TO_EGP_RATE : 1);
      const totalEGP = b.totalAmount * (b.currency === 'USD' ? USD_TO_EGP_RATE : 1);

      // Attribution model: proportional split between accommodation and amenities
      // First calculate services total cost in EGP
      const baseServicesCostEGP = b.services.reduce((acc, sid) => {
        const s = state.services.find(x => x.id === sid);
        return acc + (s ? (b.currency === 'USD' ? s.price * USD_TO_EGP_RATE : s.price) : 0);
      }, 0);

      const extraServicesCostEGP = (b.extraServices || []).reduce((acc, s) => {
        return acc + (s.isPaid ? (b.currency === 'USD' ? s.price * USD_TO_EGP_RATE : s.price) : 0);
      }, 0);

      const totalAmenitiesEGP = baseServicesCostEGP + extraServicesCostEGP;
      const totalAccommodationPortionEGP = Math.max(0, totalEGP - totalAmenitiesEGP);

      // Ratio of payment to total
      const paymentRatio = totalEGP > 0 ? paidEGP / totalEGP : 0;
      
      const accommodationRevenue = totalAccommodationPortionEGP * paymentRatio;
      const amenityRevenue = totalAmenitiesEGP * paymentRatio;

      totalAccommodationEGP += accommodationRevenue;
      totalServicesEGP += amenityRevenue;

      const p = b.platform || 'Direct';
      if (channelSummary[p]) {
        channelSummary[p].revenue += paidEGP;
        channelSummary[p].count += 1;
      }

      inflow.push({
        id: `book-${b.id}`,
        date: b.startDate,
        category: 'ACCOMMODATION',
        source: guest?.name || 'Walk-in',
        ref: `${b.displayId} (Unit ${apt?.unitNumber})`,
        amount: b.paidAmount,
        currency: b.currency,
        method: b.paymentMethod
      });
    });

    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      outflow.push({
        id: `exp-${e.id}`,
        date: e.date,
        category: e.category.toUpperCase(),
        ref: state.apartments.find(a => a.id === e.apartmentId)?.unitNumber || 'General',
        details: e.description,
        amount: e.amount,
        currency: e.currency
      });
    });

    return { 
      inflow: inflow.sort((a,b) => b.date.localeCompare(a.date)), 
      outflow: outflow.sort((a,b) => b.date.localeCompare(a.date)),
      totalAccommodationEGP,
      totalServicesEGP,
      channelSummary
    };
  }, [state, dateRange]);

  const stats = useMemo(() => {
    const sumOut = (arr: any[]) => arr.reduce((acc, curr) => acc + (curr.currency === 'USD' ? curr.amount * USD_TO_EGP_RATE : curr.amount), 0);
    const income = financialData.totalAccommodationEGP + financialData.totalServicesEGP;
    const expense = sumOut(financialData.outflow);
    return { income, expense, net: income - expense };
  }, [financialData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl"><Scale className="w-7 h-7" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Financial Intelligence</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-2">Revenue Decomposition V15.4</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100">
             <Calendar className="w-3.5 h-3.5 text-slate-400" />
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent font-black text-[11px] outline-none" />
             <span className="text-slate-300">→</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent font-black text-[11px] outline-none" />
          </div>
          <button onClick={() => window.print()} className="bg-slate-950 text-white p-2.5 rounded-xl hover:bg-sky-600 transition-all"><Printer className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="p-6 bg-slate-950 rounded-[2.5rem] text-white">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Total Gross Revenue</p>
            <p className="text-3xl font-black tracking-tighter text-emerald-400">{stats.income.toLocaleString()} <span className="text-xs">EGP</span></p>
         </div>
         <div className="p-6 bg-white rounded-[2.5rem] border border-slate-200">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Accommodation</p>
            <p className="text-2xl font-black text-slate-900">{financialData.totalAccommodationEGP.toLocaleString()} <span className="text-[10px] opacity-30">EGP</span></p>
            <Bed className="w-4 h-4 text-sky-500 mt-2" />
         </div>
         <div className="p-6 bg-white rounded-[2.5rem] border border-slate-200">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Services & Extras</p>
            <p className="text-2xl font-black text-sky-600">{financialData.totalServicesEGP.toLocaleString()} <span className="text-[10px] opacity-30">EGP</span></p>
            <Zap className="w-4 h-4 text-sky-500 mt-2" />
         </div>
         <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100">
            <p className="text-[8px] font-black uppercase tracking-widest text-rose-600 mb-2">Total Expenses</p>
            <p className="text-2xl font-black text-rose-700">-{stats.expense.toLocaleString()} <span className="text-[10px] opacity-30">EGP</span></p>
            <TrendingDown className="w-4 h-4 text-rose-400 mt-2" />
         </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
         <button onClick={() => setActiveTab('CONSOLIDATED')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CONSOLIDATED' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Ledger</button>
         <button onClick={() => setActiveTab('CHANNELS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CHANNELS' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Channels</button>
      </div>

      {activeTab === 'CONSOLIDATED' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
           <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black uppercase tracking-widest">Revenue Ledger</h3>
           </div>
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-400 border-b">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Ref / ID</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4 text-right">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {financialData.inflow.map(l => (
                    <tr key={l.id} className="text-[11px] font-bold">
                       <td className="px-8 py-4 text-slate-400">{l.date}</td>
                       <td className="px-8 py-4 uppercase">
                          <p>{l.source}</p>
                          <p className="text-[9px] text-sky-600 tracking-tight">{l.ref}</p>
                       </td>
                       <td className="px-8 py-4">
                          <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${l.category === 'ACCOMMODATION' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                             {l.category}
                          </span>
                       </td>
                       <td className="px-8 py-4 text-right text-emerald-600 font-black">+{l.amount.toLocaleString()} {l.currency}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'CHANNELS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {PLATFORMS.filter(p => financialData.channelSummary[p]?.count > 0).map(p => (
              <div key={p} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Globe className="w-20 h-20" /></div>
                 <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">{p}</p>
                 <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{financialData.channelSummary[p].revenue.toLocaleString()} <span className="text-xs opacity-30">EGP</span></h4>
                 <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-slate-400">Total Reservations</span>
                    <span className="text-xs font-black text-slate-900">{financialData.channelSummary[p].count} Records</span>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
