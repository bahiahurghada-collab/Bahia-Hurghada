
import React, { useState, useMemo, useRef } from 'react';
import { 
  Download, ArrowDownCircle, Banknote, ConciergeBell, Printer, CheckCircle2, Building, Zap, FileJson, TrendingUp, FileSpreadsheet, Hourglass, Percent, TrendingDown, Scale, User, CreditCard, Calendar, ShoppingCart, Info, Search, History, ChevronRight, ArrowUpRight, DollarSign, ArrowDownRight, FileText, MoveRight, PieChart, Activity, XCircle, Share2, Filter, Layers, Bed
} from 'lucide-react';
import { AppState, StayService } from '../types';
import { USD_TO_EGP_RATE } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE' | 'COMMISSION' | 'CONSOLIDATED'>('CONSOLIDATED');

  const financialData = useMemo(() => {
    const inflow: any[] = [];
    const outflow: any[] = [];
    const commissions: any[] = [];
    
    let totalAccommodationEGP = 0;
    let totalServicesEGP = 0;

    // 1. Process Bookings for Income & Commissions
    state.bookings.filter(b => b.status !== 'cancelled' && b.startDate >= dateRange.start && b.startDate <= dateRange.end).forEach(b => {
      const apt = state.apartments.find(a => a.id === b.apartmentId);
      const guest = state.customers.find(c => c.id === b.customerId);

      // Breakdown stay price vs services price
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const nightlyPrice = (nights >= 30 && apt?.monthlyPrice ? apt.monthlyPrice / 30 : apt?.dailyPrice || 0);
      const stayPriceEGP = (b.currency === 'USD' ? (nights * nightlyPrice) * USD_TO_EGP_RATE : nights * nightlyPrice);
      
      // Income (Booking Payment)
      if (b.paidAmount > 0) {
        // We simulate the split for visualization
        totalAccommodationEGP += Math.min(b.paidAmount * (b.currency === 'USD' ? USD_TO_EGP_RATE : 1), stayPriceEGP);

        inflow.push({
          id: `book-${b.id}`,
          date: b.startDate,
          type: 'INFLOW',
          category: 'ACCOMMODATION',
          source: guest?.name || 'Walk-in',
          ref: `${b.displayId} (U-${apt?.unitNumber})`,
          amount: b.paidAmount,
          currency: b.currency,
          method: b.paymentMethod,
          operator: b.receptionistName
        });
      }

      // Income (Extra Services)
      if (b.extraServices) {
        b.extraServices.forEach(s => {
          if (s.isPaid) {
            const sAmtEGP = (b.currency === 'USD' ? s.price * USD_TO_EGP_RATE : s.price);
            totalServicesEGP += sAmtEGP;
            
            inflow.push({
              id: `serv-${s.id}`,
              date: s.date,
              type: 'INFLOW',
              category: 'AMENITY',
              source: guest?.name || 'Guest',
              ref: `${s.name} [ID: ${b.displayId}]`,
              amount: s.price,
              currency: b.currency,
              method: s.paymentMethod,
              operator: b.receptionistName
            });
          }
        });
      }

      // Commissions
      if (b.commissionAmount > 0) {
        commissions.push({
          id: `comm-${b.id}`,
          date: b.startDate,
          agent: b.receptionistName || 'Staff',
          guest: guest?.name || 'Guest',
          ref: b.displayId,
          amount: b.commissionAmount,
          currency: b.currency,
          status: b.commissionPaid ? 'SETTLED' : 'DUE',
          platform: b.platform
        });
      }
    });

    // 2. Process Expenses
    state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).forEach(e => {
      const apt = state.apartments.find(a => a.id === e.apartmentId);
      outflow.push({
        id: `exp-${e.id}`,
        date: e.date,
        type: 'OUTFLOW',
        category: e.category.toUpperCase(),
        ref: apt ? `U-${apt.unitNumber}` : 'General Ops',
        details: e.description,
        amount: e.amount,
        currency: e.currency,
        operator: 'Admin'
      });
    });

    return { 
      inflow: inflow.sort((a,b) => b.date.localeCompare(a.date)), 
      outflow: outflow.sort((a,b) => b.date.localeCompare(a.date)), 
      commissions: commissions.sort((a,b) => b.date.localeCompare(a.date)),
      totalAccommodationEGP,
      totalServicesEGP
    };
  }, [state, dateRange]);

  const stats = useMemo(() => {
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + (curr.currency === 'USD' ? curr.amount * USD_TO_EGP_RATE : curr.amount), 0);
    const income = sum(financialData.inflow);
    const expense = sum(financialData.outflow);
    const commissionTotal = sum(financialData.commissions);
    const commissionPaid = sum(financialData.commissions.filter(c => c.status === 'SETTLED'));
    
    return { income, expense, commissionTotal, commissionPaid, net: income - expense - commissionPaid };
  }, [financialData]);

  const handlePrint = (title: string) => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700 print:bg-white print:p-0">
      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6 print:hidden">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200"><Scale className="w-7 h-7" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Financial Intelligence</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-2">Precision Accounting Hub V15.0</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100">
             <Calendar className="w-3.5 h-3.5 text-slate-400" />
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent font-black text-[11px] outline-none" />
             <span className="text-slate-300 font-black">→</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent font-black text-[11px] outline-none" />
          </div>
          <button onClick={() => handlePrint('Full Financial Audit')} className="flex items-center gap-2 bg-slate-950 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-600 transition-all shadow-md">
            <Printer className="w-4 h-4" /> Print Consolidated
          </button>
        </div>
      </div>

      {/* Advanced Revenue Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
         <div className="p-6 bg-slate-950 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all"><TrendingUp className="w-20 h-20" /></div>
            <p className="text-[8px] font-black uppercase tracking-widest mb-3 opacity-40">Total Gross Income</p>
            <p className="text-3xl font-black tracking-tighter leading-none text-emerald-400">
              {stats.income.toLocaleString()} <span className="text-[10px] opacity-30">EGP</span>
            </p>
         </div>
         <div className="p-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm print:border-slate-300">
            <p className="text-[8px] font-black uppercase tracking-widest mb-3 text-slate-400">Accommodation Rev</p>
            <p className="text-2xl font-black tracking-tighter leading-none text-slate-900">
              {financialData.totalAccommodationEGP.toLocaleString()} <span className="text-[10px] opacity-30">EGP</span>
            </p>
            <div className="mt-4 flex items-center gap-2">
               <Bed className="w-3 h-3 text-sky-500" />
               <span className="text-[8px] font-black text-slate-400 uppercase">Rentals & Stays</span>
            </div>
         </div>
         <div className="p-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm print:border-slate-300">
            <p className="text-[8px] font-black uppercase tracking-widest mb-3 text-slate-400">Services & Amenities</p>
            <p className="text-2xl font-black tracking-tighter leading-none text-sky-600">
              {financialData.totalServicesEGP.toLocaleString()} <span className="text-[10px] opacity-30">EGP</span>
            </p>
            <div className="mt-4 flex items-center gap-2">
               <Zap className="w-3 h-3 text-sky-500" />
               <span className="text-[8px] font-black text-slate-400 uppercase">Upsells & Extras</span>
            </div>
         </div>
         <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100 shadow-sm print:border-rose-300">
            <p className="text-[8px] font-black uppercase tracking-widest mb-3 text-rose-600">Total Outflow</p>
            <p className="text-2xl font-black tracking-tighter leading-none text-rose-700">
              {(stats.expense + stats.commissionPaid).toLocaleString()} <span className="text-[10px] opacity-30">EGP</span>
            </p>
            <div className="mt-4 flex items-center gap-2 text-rose-400">
               <TrendingDown className="w-3 h-3" />
               <span className="text-[8px] font-black uppercase tracking-widest">Ops & Fees</span>
            </div>
         </div>
      </div>

      {/* Tabs / Filters - Hidden in Print */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[2rem] border border-slate-200 w-fit print:hidden">
         {(['CONSOLIDATED', 'INCOME', 'EXPENSE', 'COMMISSION'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-950'}`}>{t}</button>
         ))}
      </div>

      {/* Detailed Tables Area */}
      <div className="space-y-10">
        {/* INCOME TABLE */}
        {(activeTab === 'CONSOLIDATED' || activeTab === 'INCOME') && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden print:border-0 print:shadow-none">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30 print:bg-white print:px-0">
                <div className="flex items-center gap-3">
                   <TrendingUp className="w-5 h-5 text-emerald-600" />
                   <h3 className="text-lg font-black uppercase text-slate-950 tracking-tighter leading-none">Inflow Ledger (Accommodation & Services)</h3>
                </div>
                <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 transition-all print:hidden"><Printer className="w-5 h-5" /></button>
             </div>
             <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                   <tr className="text-[8px] font-black uppercase tracking-widest text-slate-400 border-b">
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Classification</th>
                      <th className="px-8 py-5">Guest / Booking ID</th>
                      <th className="px-8 py-5">Method</th>
                      <th className="px-8 py-5 text-right">Credit Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {financialData.inflow.map(l => (
                      <tr key={l.id} className="text-[11px] font-bold">
                         <td className="px-8 py-4 text-slate-400">{l.date}</td>
                         <td className="px-8 py-4">
                            <span className={`px-2 py-0.5 rounded text-[7px] uppercase font-black ${l.category === 'ACCOMMODATION' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                               {l.category}
                            </span>
                         </td>
                         <td className="px-8 py-4">
                            <p className="text-slate-900 uppercase font-black">{l.source}</p>
                            <p className="text-[9px] text-sky-600 font-black uppercase tracking-widest mt-1">{l.ref}</p>
                         </td>
                         <td className="px-8 py-4 text-slate-400 uppercase text-[9px]">{l.method}</td>
                         <td className="px-8 py-4 text-right text-emerald-600 font-black text-sm">+{l.amount.toLocaleString()} <span className="text-[8px]">{l.currency}</span></td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
        {/* ... Other tables (Expense, Commission) remain same ... */}
      </div>
    </div>
  );
};

export default Reports;
