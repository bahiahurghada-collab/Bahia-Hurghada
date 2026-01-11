
import React, { useState, useMemo } from 'react';
import { 
  Download, ArrowDownCircle, Banknote, ConciergeBell, Printer, CheckCircle2, Table as TableIcon, Building, Zap, FileJson, TrendingUp, FileSpreadsheet, Hourglass, Percent, TrendingDown, Scale, User, CreditCard, Calendar, ShoppingCart, Info, Search, History, ChevronRight, ArrowUpRight, DollarSign, ArrowDownRight, FileText, MoveRight, PieChart, Activity, XCircle
} from 'lucide-react';
import { AppState, StayService } from '../types';
import { USD_TO_EGP_RATE } from '../constants';

const Reports: React.FC<{ state: AppState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'inflow' | 'outflow' | 'units'>('all');
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);

  const reportData = useMemo(() => {
    let collectedEGP = 0;
    let pendingEGP = 0;
    let collectedUSD = 0;
    let pendingUSD = 0;
    let totalDiscountEGP = 0;
    let totalCommissionEGP = 0;
    let totalCommissionUSD = 0;
    let servicesRevenueEGP = 0;
    
    const roomSummary: Record<string, { id: string, unit: string, revenue: number, collected: number, pending: number, discount: number, commission: number, expenses: number, services: number, bookingsCount: number }> = {};
    state.apartments.forEach(a => { 
      roomSummary[a.id] = { id: a.id, unit: a.unitNumber, revenue: 0, collected: 0, pending: 0, discount: 0, commission: 0, expenses: 0, services: 0, bookingsCount: 0 }; 
    });

    const ledger: Array<{id: string, date: string, type: 'INFLOW' | 'OUTFLOW', category: string, entity: string, details: string, amount: number, currency: string, method: string, operator: string, aptId?: string}> = [];

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
        roomSummary[apartment.id].bookingsCount += 1;
      }

      if (b.paidAmount > 0) {
        ledger.push({
          id: `book-${b.id}`,
          date: b.startDate,
          type: 'INFLOW',
          category: 'BOOKING_PAYMENT',
          entity: customer?.name || 'Walk-in Guest',
          details: `Unit ${apartment?.unitNumber} Reservation`,
          amount: b.paidAmount,
          currency: b.currency,
          method: b.paymentMethod,
          operator: b.receptionistName,
          aptId: b.apartmentId
        });
      }

      if (b.commissionAmount > 0) {
        ledger.push({
          id: `comm-${b.id}`,
          date: b.startDate,
          type: 'OUTFLOW',
          category: 'STAFF_COMMISSION',
          entity: b.receptionistName || 'Staff',
          details: `Commission for Unit ${apartment?.unitNumber} (Guest: ${customer?.name})`,
          amount: b.commissionAmount,
          currency: b.currency,
          method: b.commissionPaid ? 'Settled' : 'Pending',
          operator: 'System',
          aptId: b.apartmentId
        });
      }

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
               operator: b.receptionistName,
               aptId: b.apartmentId
            });
          }
        });
      }
    });

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
        operator: 'Admin',
        aptId: e.apartmentId
      });
    });

    return { 
      collectedEGP, pendingEGP, collectedUSD, pendingUSD, totalDiscountEGP, totalCommissionEGP, totalCommissionUSD, 
      roomSummary, servicesRevenueEGP,
      ledger: ledger.sort((a,b) => b.date.localeCompare(a.date))
    };
  }, [state, dateRange]);

  const totalInflowEGP = reportData.collectedEGP + (reportData.collectedUSD * USD_TO_EGP_RATE);
  const totalOutflowEGP = reportData.totalCommissionEGP + (reportData.totalCommissionUSD * USD_TO_EGP_RATE) + state.expenses.reduce((acc, e) => acc + (e.currency === 'EGP' ? e.amount : e.amount * USD_TO_EGP_RATE), 0);

  const filteredLedger = useMemo(() => {
    let base = reportData.ledger;
    if (activeLedgerTab === 'inflow') base = base.filter(l => l.type === 'INFLOW');
    if (activeLedgerTab === 'outflow') base = base.filter(l => l.type === 'OUTFLOW');
    if (selectedAptId) base = base.filter(l => l.aptId === selectedAptId);
    return base;
  }, [reportData.ledger, activeLedgerTab, selectedAptId]);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200"><Scale className="w-7 h-7" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Financial Audit</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-2">Strategic Profit & Loss Analysis</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100">
             <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent font-black text-[11px] text-slate-900 outline-none" />
             </div>
             <span className="text-slate-300 font-black">→</span>
             <div className="flex items-center gap-2">
                <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent font-black text-[11px] text-slate-900 outline-none" />
             </div>
          </div>
          <button onClick={() => {}} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md"><FileSpreadsheet className="w-4 h-4" /> Export Report</button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Gross Inflow</p>
            <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none">{totalInflowEGP.toLocaleString()} <span className="text-xs font-bold opacity-30">EGP</span></p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[7px] font-black uppercase">Incl. Services & Fees</span>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Total Expenses</p>
            <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none">{totalOutflowEGP.toLocaleString()} <span className="text-xs font-bold opacity-30">EGP</span></p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[7px] font-black uppercase">Main. & Comm.</span>
            </div>
         </div>
         <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-20 h-20" /></div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-4">Net Operating Profit</p>
            <p className="text-3xl font-black text-white tracking-tighter leading-none">{(totalInflowEGP - totalOutflowEGP).toLocaleString()} <span className="text-xs font-bold opacity-30">EGP</span></p>
         </div>
         <div className="bg-sky-50 p-8 rounded-[2.5rem] border border-sky-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-4">Total Amenities Rev</p>
            <p className="text-3xl font-black text-sky-950 tracking-tighter leading-none">{reportData.servicesRevenueEGP.toLocaleString()} <span className="text-xs font-bold opacity-30">EGP</span></p>
         </div>
      </div>

      {/* Unit Analytics Tab */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white"><PieChart className="w-5 h-5" /></div>
              <h3 className="text-lg font-black uppercase text-slate-950 tracking-tighter">Unit Profitability Hub</h3>
           </div>
           
           <div className="flex bg-white p-1 rounded-xl border border-slate-200">
             <button onClick={() => { setActiveLedgerTab('all'); setSelectedAptId(null); }} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeLedgerTab !== 'units' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400'}`}>General Ledger</button>
             <button onClick={() => setActiveLedgerTab('units')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeLedgerTab === 'units' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400'}`}>Unit Analysis</button>
           </div>
        </div>

        {activeLedgerTab === 'units' ? (
           <div className="overflow-x-auto">
              <table className="w-full text-left font-bold border-collapse">
                 <thead>
                    <tr className="bg-slate-50/30 text-slate-400 text-[8px] uppercase tracking-[0.2em] border-b border-slate-100">
                       <th className="px-8 py-5">Unit Info</th>
                       <th className="px-8 py-5 text-center">Bookings</th>
                       <th className="px-8 py-5 text-right">Gross Income</th>
                       <th className="px-8 py-5 text-right">Expenses</th>
                       <th className="px-8 py-5 text-right">Net Profit</th>
                       <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {Object.values(reportData.roomSummary).sort((a,b) => b.revenue - a.revenue).map(r => (
                       <tr key={r.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs border border-slate-200">U-{r.unit}</div>
                                <span className="text-[11px] font-black uppercase">Suite Portfolio</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-center font-black text-slate-900">{r.bookingsCount}</td>
                          <td className="px-8 py-5 text-right font-black text-emerald-600">{r.revenue.toLocaleString()} EGP</td>
                          <td className="px-8 py-5 text-right font-black text-rose-500">{r.expenses.toLocaleString()} EGP</td>
                          <td className="px-8 py-5 text-right">
                             <div className="bg-slate-950 text-white px-3 py-1.5 rounded-xl inline-block text-[11px] font-black tracking-tighter">
                                {(r.revenue - r.expenses).toLocaleString()} EGP
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button onClick={() => { setSelectedAptId(r.id); setActiveLedgerTab('all'); }} className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-500 hover:text-white transition-all"><FileText className="w-4 h-4" /></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        ) : (
           <div className="overflow-x-auto">
             {selectedAptId && (
                <div className="p-4 bg-sky-50 border-b border-sky-100 flex justify-between items-center">
                   <p className="text-[10px] font-black text-sky-700 uppercase flex items-center gap-2">
                      <Building className="w-3 h-3" /> Filtering Ledger for Unit: {state.apartments.find(a => a.id === selectedAptId)?.unitNumber}
                   </p>
                   <button onClick={() => setSelectedAptId(null)} className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Clear Filter</button>
                </div>
             )}
             <table className="w-full text-left font-bold border-collapse">
                <thead>
                   <tr className="bg-slate-50/30 text-slate-400 text-[8px] uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="px-8 py-5">Value Date</th>
                      <th className="px-8 py-5">Class</th>
                      <th className="px-8 py-5">Party / Narration</th>
                      <th className="px-8 py-5 text-right">Credit / Debit</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredLedger.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-all text-[11px]">
                         <td className="px-8 py-5">
                            <p className="text-slate-900 font-black">{l.date}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Op: {l.operator}</p>
                         </td>
                         <td className="px-8 py-5">
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase w-fit ${l.type === 'INFLOW' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{l.category}</span>
                         </td>
                         <td className="px-8 py-5">
                            <p className="text-slate-900 font-black uppercase tracking-tight truncate max-w-[200px]">{l.entity}</p>
                            <p className="text-[9px] font-medium text-slate-400 truncate max-w-[250px]">{l.details}</p>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <p className={`text-lg font-black tracking-tighter ${l.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {l.type === 'INFLOW' ? '+' : '-'}{l.amount.toLocaleString()} 
                               <span className="text-[8px] font-bold opacity-30 ml-1">{l.currency}</span>
                            </p>
                         </td>
                      </tr>
                   ))}
                   {filteredLedger.length === 0 && (
                      <tr><td colSpan={4} className="py-20 text-center opacity-30 font-black text-[10px] uppercase">No transactions recorded for this filter</td></tr>
                   )}
                </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
