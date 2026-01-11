
import React, { useState, useMemo } from 'react';
import { 
  Download, ArrowDownCircle, Banknote, ConciergeBell, Printer, CheckCircle2, Table as TableIcon, Building, Zap, FileJson, TrendingUp, FileSpreadsheet, Hourglass, Percent, TrendingDown, Scale, User, CreditCard, Calendar, ShoppingCart, Info, Search, History, ChevronRight
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

    const ledger: Array<{id: string, date: string, type: 'INFLOW' | 'OUTFLOW', category: string, entity: string, details: string, amount: number, currency: string, method: string}> = [];

    const filteredBookings = state.bookings.filter(b => b.startDate >= dateRange.start && b.startDate <= dateRange.end && b.status !== 'cancelled');
    const filteredExpenses = state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);

    filteredBookings.forEach(b => {
      const apartment = state.apartments.find(a => a.id === b.apartmentId);
      const customer = state.customers.find(c => c.id === b.customerId);
      const isEGP = b.currency === 'EGP';
      const amountInEGP = isEGP ? b.totalAmount : b.totalAmount * USD_TO_EGP_RATE;
      const paidInEGP = isEGP ? b.paidAmount : b.paidAmount * USD_TO_EGP_RATE;
      const discountInEGP = isEGP ? b.discount : b.discount * USD_TO_EGP_RATE;
      const commissionInEGP = isEGP ? b.commissionAmount : b.commissionAmount * USD_TO_EGP_RATE;

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
        roomSummary[apartment.id].revenue += amountInEGP;
        roomSummary[apartment.id].collected += paidInEGP;
        roomSummary[apartment.id].pending += (amountInEGP - paidInEGP);
        roomSummary[apartment.id].discount += discountInEGP;
        roomSummary[apartment.id].commission += commissionInEGP;
      }

      // Add Booking Payment to Ledger
      if (b.paidAmount > 0) {
        ledger.push({
          id: `book-${b.id}`,
          date: b.startDate,
          type: 'INFLOW',
          category: 'RESERVATION',
          entity: customer?.name || 'Direct Guest',
          details: `Stay in Unit ${apartment?.unitNumber || 'N/A'} (${b.startDate} to ${b.endDate})`,
          amount: b.paidAmount,
          currency: b.currency,
          method: b.paymentMethod
        });
      }

      // Add Extra Services to Ledger & Totals
      if (b.extraServices) {
        b.extraServices.forEach(s => {
          if (s.isPaid) {
            const sPriceEGP = isEGP ? s.price : s.price * USD_TO_EGP_RATE;
            servicesRevenueEGP += sPriceEGP;
            if (apartment) roomSummary[apartment.id].services += sPriceEGP;

            ledger.push({
               id: `serv-${s.id}`,
               date: s.date,
               type: 'INFLOW',
               category: 'AMENITY_SALE',
               entity: customer?.name || 'Direct Guest',
               details: `${s.name} (Unit ${apartment?.unitNumber})`,
               amount: s.price,
               currency: b.currency,
               method: s.paymentMethod
            });
          }
        });
      }
    });

    filteredExpenses.forEach(e => {
      const amountEGP = e.currency === 'EGP' ? e.amount : e.amount * USD_TO_EGP_RATE;
      const apt = state.apartments.find(a => a.id === e.apartmentId);
      if (e.apartmentId && roomSummary[e.apartmentId]) {
        roomSummary[e.apartmentId].expenses += amountEGP;
      }

      ledger.push({
        id: `exp-${e.id}`,
        date: e.date,
        type: 'OUTFLOW',
        category: e.category.toUpperCase(),
        entity: 'EXTERNAL_SUPPLIER',
        details: `${e.description} ${apt ? `for Unit ${apt.unitNumber}` : '(General)'}`,
        amount: e.amount,
        currency: e.currency,
        method: 'Cash/Transfer'
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

  const handleExportCSV = () => {
    let rows = [
      ["FINANCIAL AUDIT REPORT - BAHIA HURGHADA"],
      ["Period", `${dateRange.start} to ${dateRange.end}`],
      ["Generated", new Date().toLocaleString()],
      [],
      ["SUMMARY STATS"],
      ["Total Realized Inflow (EGP Eq.)", totalInflowEGP.toFixed(2)],
      ["Services Revenue (EGP Eq.)", reportData.servicesRevenueEGP.toFixed(2)],
      ["Total Pending Collection (EGP Eq.)", totalPendingEGP.toFixed(2)],
      ["Total Operations Outflow (EGP Eq.)", totalOutflowEGP.toFixed(2)],
      ["Total Discounts Sacrifice", reportData.totalDiscountEGP.toFixed(2)],
      [],
      ["DETAILED FINANCIAL LEDGER"],
      ["Date", "Type", "Category", "Entity", "Details", "Amount", "Currency", "Method"]
    ];

    reportData.ledger.forEach(l => {
      rows.push([
        l.date,
        l.type,
        l.category,
        l.entity,
        l.details,
        l.amount.toString(),
        l.currency,
        l.method
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bahia_Finance_Report_${dateRange.start}_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLedger = reportData.ledger.filter(l => {
    if (activeLedgerTab === 'all') return true;
    return l.type === activeLedgerTab.toUpperCase();
  });

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      <div className="no-print bg-white p-10 rounded-[4rem] shadow-sm border-2 border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
             <Scale className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">Accounting Hub</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-3">Full Transaction History & Audit</p>
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
          <button onClick={handleExportCSV} className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 border-b-4 border-emerald-800"><FileSpreadsheet className="w-5 h-5" /> Export CSV</button>
          <button onClick={() => window.print()} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl border-b-4 border-slate-950"><Printer className="w-5 h-5" /> PDF Audit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <div className="bg-emerald-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Realized Inflow</p>
            <p className="text-4xl font-black mt-4 tracking-tighter">{totalInflowEGP.toLocaleString()} <span className="text-sm font-bold opacity-40">EGP Eq.</span></p>
            <div className="mt-8 flex items-center justify-between text-[10px] font-black opacity-80 uppercase bg-black/10 p-3 rounded-2xl">
              <span>Rooms: {(totalInflowEGP - reportData.servicesRevenueEGP).toLocaleString()}</span>
              <span>Services: {reportData.servicesRevenueEGP.toLocaleString()}</span>
            </div>
         </div>
         <div className="bg-rose-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2"><Hourglass className="w-3 h-3" /> Pending Collection</p>
            <p className="text-4xl font-black mt-4 tracking-tighter">{totalPendingEGP.toLocaleString()} <span className="text-sm font-bold opacity-40">EGP Eq.</span></p>
            <div className="mt-8 flex items-center justify-between text-[10px] font-black opacity-80 uppercase bg-black/10 p-3 rounded-2xl">
              <span>EGP: {reportData.pendingEGP.toLocaleString()}</span>
              <span>USD: {reportData.pendingUSD.toLocaleString()}</span>
            </div>
         </div>
         <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border-b-8 border-slate-900">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><TrendingDown className="w-3 h-3" /> OpEx Outflow</p>
            <p className="text-4xl font-black mt-4 tracking-tighter">{totalOutflowEGP.toLocaleString()} <span className="text-sm font-bold opacity-40">EGP Eq.</span></p>
            <p className="mt-6 text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Maintenance & Comms</p>
         </div>
         <div className="bg-sky-50 p-10 rounded-[3.5rem] border-2 border-sky-100 shadow-sm flex flex-col justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 flex items-center gap-2"><Percent className="w-3 h-3" /> Yield Sacrificed</p>
               <p className="text-4xl font-black mt-4 text-sky-950 tracking-tighter">{reportData.totalDiscountEGP.toLocaleString()} <span className="text-sm font-bold opacity-30 text-sky-950">EGP</span></p>
            </div>
            <div className="mt-8 p-4 bg-sky-100/50 rounded-2xl">
              <p className="text-[9px] font-black text-sky-800 uppercase tracking-widest leading-relaxed">Discounts given for volume or direct loyalty bookings.</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[4rem] border-2 border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-10 border-b-2 border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                <History className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter">Unified Financial Ledger</h3>
           </div>
           
           <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-inner">
             <button onClick={() => setActiveLedgerTab('all')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeLedgerTab === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Full Log</button>
             <button onClick={() => setActiveLedgerTab('inflow')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeLedgerTab === 'inflow' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600'}`}>Inflow Only</button>
             <button onClick={() => setActiveLedgerTab('outflow')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeLedgerTab === 'outflow' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-rose-600'}`}>Outflow Only</button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-bold">
             <thead>
                <tr className="bg-slate-100/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b">
                   <th className="px-10 py-8">Timestamp</th>
                   <th className="px-10 py-8">Class</th>
                   <th className="px-10 py-8">Entity & Details</th>
                   <th className="px-10 py-8 text-right">Method</th>
                   <th className="px-10 py-8 text-right">Value</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {filteredLedger.map(l => (
                   <tr key={l.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-10 py-8">
                         <p className="text-slate-950 font-black text-sm">{l.date}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">Operational Date</p>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase w-fit ${l.type === 'INFLOW' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{l.type}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l.category}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <p className="text-slate-900 font-black text-base">{l.entity}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><ChevronRight className="w-3 h-3" /> {l.details}</p>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest">{l.method}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <p className={`text-2xl font-black tracking-tighter ${l.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {l.type === 'INFLOW' ? '+' : '-'}{l.amount.toLocaleString()} 
                            <span className="text-xs font-bold opacity-30 ml-1">{l.currency}</span>
                         </p>
                      </td>
                   </tr>
                ))}
                {filteredLedger.length === 0 && (
                   <tr>
                      <td colSpan={5} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-4 text-slate-200">
                            <Banknote className="w-20 h-20 opacity-20" />
                            <p className="font-black text-sm uppercase tracking-[0.3em] text-slate-300">Zero Transaction Movement Logged</p>
                         </div>
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border-2 border-slate-100 shadow-2xl overflow-hidden mt-10">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-2xl font-black uppercase text-slate-950 flex items-center gap-4"><Building className="w-7 h-7 text-sky-600" /> Room Performance Folio</h3>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Summary per Asset</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-bold text-sm">
             <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                   <th className="px-10 py-8">Apartment</th>
                   <th className="px-10 py-8 text-right">Gross Total</th>
                   <th className="px-10 py-8 text-right text-sky-600">Serv. Revenue</th>
                   <th className="px-10 py-8 text-right text-emerald-600">Settled Inflow</th>
                   <th className="px-10 py-8 text-right text-rose-500">Active Debt</th>
                   <th className="px-10 py-8 text-right text-sky-500">Disc. Given</th>
                   <th className="px-10 py-8 text-right text-amber-600">Comms Paid</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {/* Fix: Explicitly typing the room object to avoid 'unknown' type errors from Object.values */}
                {Object.values(reportData.roomSummary).map((room: any) => (
                   <tr key={room.unit} className="hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-8 font-black text-slate-950 uppercase text-lg">Unit {room.unit}</td>
                      <td className="px-10 py-8 text-right font-black text-slate-900">{room.revenue.toLocaleString()}</td>
                      <td className="px-10 py-8 text-right text-sky-600 font-black">{room.services.toLocaleString()}</td>
                      <td className="px-10 py-8 text-right text-emerald-600 font-black">{room.collected.toLocaleString()}</td>
                      <td className="px-10 py-8 text-right text-rose-500 font-black">{room.pending.toLocaleString()}</td>
                      <td className="px-10 py-8 text-right text-sky-600 font-black">{room.discount.toLocaleString()}</td>
                      <td className="px-10 py-8 text-right text-amber-600 font-black">{room.commission.toLocaleString()}</td>
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
