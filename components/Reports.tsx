
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Scale, Calendar, Printer, Bed, Zap, FileText, Search, CreditCard, DollarSign
} from 'lucide-react';
import { AppState } from '../types';
import { USD_TO_EGP_RATE } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'CONSOLIDATED' | 'INCOME' | 'EXPENSE'>('CONSOLIDATED');

  const financialData = useMemo(() => {
    const inflow: any[] = [];
    const outflow: any[] = [];
    
    let totalAccommodationEGP = 0;
    let totalServicesEGP = 0;

    state.bookings.filter(b => b.status !== 'cancelled' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      const apt = state.apartments.find(a => a.id === b.apartmentId);
      const guest = state.customers.find(c => c.id === b.customerId);

      // 1. Accommodation Revenue Calculation
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const nightlyPrice = (nights >= 30 && apt?.monthlyPrice ? apt.monthlyPrice / 30 : apt?.dailyPrice || 0);
      const stayPriceEGP = (b.currency === 'USD' ? (nights * nightlyPrice) * USD_TO_EGP_RATE : nights * nightlyPrice);
      
      const paidEGP = b.paidAmount * (b.currency === 'USD' ? USD_TO_EGP_RATE : 1);
      
      // We attribute payment to accommodation first, then overflow to services if any (simple model)
      const accommodationPortion = Math.min(paidEGP, stayPriceEGP);
      totalAccommodationEGP += accommodationPortion;

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

      // 2. Services Revenue Calculation
      // Primary services selected at booking
      b.services.forEach(sid => {
        if ((b.fulfilledServices || []).includes(sid)) {
          const s = state.services.find(x => x.id === sid);
          if (s) {
            totalServicesEGP += (b.currency === 'USD' ? s.price * USD_TO_EGP_RATE : s.price);
            inflow.push({
              id: `serv-base-${b.id}-${sid}`,
              date: b.startDate,
              category: 'AMENITY',
              source: guest?.name || 'Guest',
              ref: `${s.name} [ID: ${b.displayId}]`,
              amount: s.price,
              currency: b.currency,
              method: b.paymentMethod
            });
          }
        }
      });

      // Extra stay services
      (b.extraServices || []).forEach(s => {
        if (s.isPaid && s.isFulfilled) {
          totalServicesEGP += (b.currency === 'USD' ? s.price * USD_TO_EGP_RATE : s.price);
          inflow.push({
            id: `serv-extra-${s.id}`,
            date: s.date,
            category: 'AMENITY',
            source: guest?.name || 'Guest',
            ref: `${s.name} [ID: ${b.displayId}]`,
            amount: s.price,
            currency: b.currency,
            method: s.paymentMethod
          });
        }
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
      totalServicesEGP
    };
  }, [state, dateRange]);

  const stats = useMemo(() => {
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + (curr.currency === 'USD' ? curr.amount * USD_TO_EGP_RATE : curr.amount), 0);
    const income = financialData.totalAccommodationEGP + financialData.totalServicesEGP;
    const expense = sum(financialData.outflow);
    return { income, expense, net: income - expense };
  }, [financialData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl"><Scale className="w-7 h-7" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Financial Intelligence</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-2">Revenue Decomposition V15.2</p>
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
    </div>
  );
};

export default Reports;
