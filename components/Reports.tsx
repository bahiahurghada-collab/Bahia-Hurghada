
import React, { useState, useMemo } from 'react';
import { 
  Download, ArrowDownCircle, Banknote, ConciergeBell, Printer, CheckCircle2, Table as TableIcon, Building, Zap, FileJson, TrendingUp, FileSpreadsheet, Hourglass, Percent, TrendingDown, Scale, User, CreditCard, Calendar, ShoppingCart, Info, Search, History, ChevronRight, ArrowUpRight, DollarSign
} from 'lucide-react';
import { AppState, StayService } from '../types';
import { USD_TO_EGP_RATE } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'inflow' | 'outflow'>('all');

  const reportData = useMemo(() => {
    let collectedEGP = 0;
    let pendingEGP = 0;
    let collectedUSD = 0;
    let pendingUSD = 0;
    let totalDiscountEGP = 0;
    let totalCommissionEGP = 0;
    let totalCommissionUSD = 0;
    let servicesRevenueEGP = 0;
    
    const roomSummary: Record<string, { unit: string, revenue: number, collected: number, pending: number, discount: number, commission: number, expenses: number, services: number }> = {};
    state.apartments.forEach(a => { 
      roomSummary[a.id] = { unit: a.unitNumber, revenue: 0, collected: 0, pending: 0, discount: 0, commission: 0, expenses: 0, services: 0 }; 
    });

    const ledger: Array<{id: string, date: string, type: 'INFLOW' | 'OUTFLOW', category: string, entity: string, details: string, amount: number, currency: string, method: string, operator: string}> = [];

    const filteredBookings = state.bookings.filter(b => b.startDate >= dateRange.start && b.startDate <= dateRange.end && b.status !== 'cancelled');
    const filteredExpenses = state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);

    filteredBookings.forEach(b => {
      const apartment = state.apartments.find(a => a.id === b.apartmentId);
      const customer = state.customers.find(c => c.id === b.customerId);
      const isEGP = b.currency === 'EGP';
      
      if (isEGP) {
        collectedEGP += b.paidAmount;
        pendingEGP += (b.totalAmount - b.paidAmount);
        totalDiscountEGP += b.discount;
        totalCommissionEGP += b.commissionAmount;
      } else {
        collectedUSD += b.paidAmount;
        pendingUSD += (b.totalAmount - b.paidAmount);
        totalCommissionUSD += b.commissionAmount;
      }

      if (apartment) {
        const amtEGP = isEGP ? b.totalAmount : b.totalAmount * USD_TO_EGP_RATE;
        const paidEGP = isEGP ? b.paidAmount : b.paidAmount * USD_TO_EGP_RATE;
        roomSummary[apartment.id].revenue += amtEGP;
        roomSummary[apartment.id].collected += paidEGP;
        roomSummary[apartment.id].pending += (amtEGP - paidEGP);
        roomSummary[apartment.id].discount += (isEGP ? b.discount : b.discount * USD_TO_EGP_RATE);
        roomSummary[apartment.id].commission += (isEGP ? b.commissionAmount : b.commissionAmount * USD_TO_EGP_RATE);
      }

      // 1. Ledger Entry: Reservation Payment
      if (b.paidAmount > 0) {
        ledger.push({
          id: `book-${b.id}`,
          date: b.startDate,
          type: 'INFLOW',
          category: 'BOOKING_PAYMENT',
          entity: customer?.name || 'Walk-in Guest',
          details: `Unit ${apartment?.unitNumber} Reservation (${b.startDate} to ${b.endDate})`,
          amount: b.paidAmount,
          currency: b.currency,
          method: b.paymentMethod,
          operator: b.receptionistName
        });
      }

      // 2. Ledger Entry: Platform Commission (If Unpaid/Recorded)
      if (b.commissionAmount > 0) {
        ledger.push({
          id: `comm-${b.id}`,
          date: b.startDate,
          type: 'OUTFLOW',
          category: 'PLATFORM_FEE',
          entity: b.platform,
          details: `Commission for Unit ${apartment?.unitNumber} (Guest: ${customer?.name})`,
          amount: b.commissionAmount,
          currency: b.currency,
          method: b.commissionPaid ? 'Settled' : 'Pending',
          operator: 'System'
        });
      }

      // 3. Ledger Entry: Extra Services
      if (b.extraServices) {
        b.extraServices.forEach(s => {
          const sPriceEGP = isEGP ? s.price : s.price * USD_TO_EGP_RATE;
          if (s.isPaid) {
            servicesRevenueEGP += sPriceEGP;
            if (apartment) roomSummary[apartment.id].services += sPriceEGP;

            ledger.push({
               id: `serv-${s.id}`,
               date: s.date,
               type: 'INFLOW',
               category: 'SERVICE_SALE',
               entity: customer?.name || 'In-House Guest',
               details: `${s.name} service for Unit ${apartment?.unitNumber}`,
               amount: s.price,
               currency: b.currency,
               method: s.paymentMethod,
               operator: b.receptionistName
            });
          }
        });
      }
    });

    // 4. Ledger Entry: Maintenance & General Expenses
    filteredExpenses.forEach(e => {
      const apt = state.apartments.find(a => a.id === e.apartmentId);
      if (e.apartmentId && roomSummary[e.apartmentId]) {
        roomSummary[e.apartmentId].expenses += (e.currency === 'EGP' ? e.amount : e.amount * USD_TO_EGP_RATE);
      }

      ledger.push({
        id: `exp-${e.id}`,
        date: e.date,
        type: 'OUTFLOW',
        category: `EXPENSE_${e.category.toUpperCase()}`,
        entity: 'Supplier/General',
        details: `${e.description} ${apt ? `(Unit ${apt.unitNumber})` : ''}`,
        amount: e.amount,
        currency: e.currency,
        method: 'Cash/Transfer',
        operator: 'Admin'
      });
    });

    return { 
      collectedEGP, pendingEGP, collectedUSD, pendingUSD, totalDiscountEGP, totalCommissionEGP, totalCommissionUSD, 
      roomSummary, servicesRevenueEGP,
      ledger: ledger.sort((a,b) => b.date.localeCompare(a.date))
    };
  }, [state, dateRange]);

  const totalInflowEGP = reportData.collectedEGP + (reportData.collectedUSD * USD_TO_EGP_RATE);
  const totalPendingEGP = reportData.pendingEGP + (reportData.pendingUSD * USD_TO_EGP_RATE);
  const totalOutflowEGP = reportData.totalCommissionEGP + (reportData.totalCommissionUSD * USD_TO_EGP_RATE) + state.expenses.reduce((acc, e) => acc + (e.currency === 'EGP' ? e.amount : e.amount * USD_TO_EGP_RATE), 0);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      {/* Financial Filter Bar */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border-2 border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-slate-200"><Scale className="w-8 h-8" /></div>
          <div>
            <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">Accountant Console</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Live Multi-Currency Audit</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-4 border-2 border-slate-100">
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent font-black text-xs text-slate-900 outline-none" />
             </div>
             <span className="text-slate-300 font-black">→</span>
             <div className="flex items-center gap-2">
                <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent font-black text-xs text-slate-900 outline-none" />
             </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"><Printer className="w-5 h-5" /> Generate PDF Audit</button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <div className="bg-emerald-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">Realized Revenue</p>
            <p className="text-4xl font-black mt-4 tracking-tighter">{totalInflowEGP.toLocaleString()} <span className="text-sm font-bold opacity-40">EGP EQ.</span></p>
            <div className="mt-8 flex items-center justify-between text-[10px] font-black opacity-80 uppercase bg-black/10 p-4 rounded-2xl">
              <div className="flex flex-col"><span>EGP</span><span className="text-lg">{reportData.collectedEGP.toLocaleString()}</span></div>
              <div className="flex flex-col text-right"><span>USD</span><span className="text-lg">{reportData.collectedUSD.toLocaleString()}</span></div>
            </div>
         </div>

         <div className="bg-rose-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">Debt / Pending</p>
            <p className="text-4xl font-black mt-4 tracking-tighter">{totalPendingEGP.toLocaleString()} <span className="text-sm font-bold opacity-40">EGP EQ.</span></p>
            <div className="mt-8 flex items-center justify-between text-[10px] font-black opacity-80 uppercase bg-black/10 p-4 rounded-2xl">
              <div className="flex flex-col"><span>EGP</span><span className="text-lg">{reportData.pendingEGP.toLocaleString()}</span></div>
              <div className="flex flex-col text-right"><span>USD</span><span className="text-lg">{reportData.pendingUSD.toLocaleString()}</span></div>
            </div>
         </div>

         <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">Operational Outflow</p>
            <p className="text-4xl font-black mt-4 tracking-tighter">{totalOutflowEGP.toLocaleString()} <span className="text-sm font-bold opacity-40">EGP EQ.</span></p>
            <div className="mt-6 flex gap-4">
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Fees & Repairs</span>
            </div>
         </div>

         <div className="bg-sky-50 p-10 rounded-[3.5rem] border-2 border-sky-100 shadow-sm flex flex-col justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Services Revenue</p>
               <p className="text-4xl font-black mt-4 text-sky-950 tracking-tighter">{reportData.servicesRevenueEGP.toLocaleString()} <span className="text-sm font-bold opacity-30 text-sky-950">EGP</span></p>
            </div>
            <div className="p-4 bg-sky-100 rounded-2xl">
               <p className="text-[9px] font-black text-sky-800 uppercase tracking-widest">Cleaning & Amenity Sales</p>
            </div>
         </div>
      </div>

      {/* Detailed Transaction Ledger */}
      <div className="bg-white rounded-[4rem] border-2 border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-10 border-b-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white"><History className="w-6 h-6" /></div>
              <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Unified Financial Ledger</h3>
           </div>
           
           <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200">
             <button onClick={() => setActiveLedgerTab('all')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeLedgerTab === 'all' ? 'bg-slate-950 text-white' : 'text-slate-400'}`}>Full Stream</button>
             <button onClick={() => setActiveLedgerTab('inflow')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeLedgerTab === 'inflow' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Inflow</button>
             <button onClick={() => setActiveLedgerTab('outflow')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeLedgerTab === 'outflow' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Outflow</button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-bold">
             <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b">
                   <th className="px-10 py-8">Timestamp</th>
                   <th className="px-10 py-8">Class & Origin</th>
                   <th className="px-10 py-8">Party & Narrative</th>
                   <th className="px-10 py-8 text-right">Operator</th>
                   <th className="px-10 py-8 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {reportData.ledger.filter(l => activeLedgerTab === 'all' || l.type === activeLedgerTab.toUpperCase()).map(l => (
                   <tr key={l.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-10 py-8">
                         <p className="text-slate-950 font-black text-sm">{l.date}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">Operational Date</p>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase w-fit ${l.type === 'INFLOW' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{l.type}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l.category}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <p className="text-slate-950 font-black text-base uppercase tracking-tighter">{l.entity}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">{l.details}</p>
                      </td>
                      <td className="px-10 py-8 text-right font-black text-xs text-slate-400">@{l.operator}</td>
                      <td className="px-10 py-8 text-right">
                         <p className={`text-2xl font-black tracking-tighter ${l.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {l.type === 'INFLOW' ? '+' : '-'}{l.amount.toLocaleString()} 
                            <span className="text-xs font-bold opacity-30 ml-2">{l.currency}</span>
                         </p>
                         <p className="text-[9px] font-black opacity-30 uppercase">{l.method}</p>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
