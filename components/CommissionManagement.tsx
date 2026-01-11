
import React, { useMemo } from 'react';
import { BadgePercent, CheckCircle2, XCircle, TrendingUp, Wallet, ArrowRight, UserCircle, DollarSign, Coins, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { AppState, Booking } from '../types';

interface CommissionManagementProps {
  state: AppState;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
}

const CommissionManagement: React.FC<CommissionManagementProps> = ({ state, onUpdateBooking }) => {
  const bookingsWithCommission = useMemo(() => {
    return state.bookings
      .filter(b => b.status !== 'cancelled' && b.status !== 'maintenance' && b.commissionAmount > 0)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [state.bookings]);

  const stats = useMemo(() => {
    let totalEGP = 0;
    let paidEGP = 0;
    let totalUSD = 0;
    let paidUSD = 0;

    bookingsWithCommission.forEach(b => {
      if (b.currency === 'EGP') {
        totalEGP += b.commissionAmount;
        if (b.commissionPaid) paidEGP += b.commissionAmount;
      } else {
        totalUSD += b.commissionAmount;
        if (b.commissionPaid) paidUSD += b.commissionAmount;
      }
    });

    return { totalEGP, paidEGP, totalUSD, paidUSD };
  }, [bookingsWithCommission]);

  const exportCSV = () => {
    const headers = ['Operator', 'Guest', 'Unit', 'Commission', 'Currency', 'Status', 'Rate Used'];
    const rows = bookingsWithCommission.map(b => [
      b.receptionistName, 
      state.customers.find(c => c.id === b.customerId)?.name,
      state.apartments.find(a => a.id === b.apartmentId)?.unitNumber,
      b.commissionAmount,
      b.currency,
      b.commissionPaid ? 'Paid' : 'Pending',
      b.exchangeRateAtBooking
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `commissions_report.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 font-bold">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Commission Hub</h2>
          <p className="text-slate-400 font-bold mt-2 text-[10px] uppercase tracking-widest">Track & Release Sales Incentives</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 mr-4 border-r pr-4 border-slate-100">
             <button onClick={exportCSV} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
             </button>
             <button onClick={() => window.print()} className="p-3 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-sm">
                <Printer className="w-5 h-5" />
             </button>
          </div>
          <div className="px-6 py-4 bg-slate-950 text-white rounded-3xl text-center border-b-8 border-sky-500 min-w-[140px]">
            <p className="text-[8px] font-black uppercase opacity-50 tracking-widest">Total USD</p>
            <p className="text-xl font-black text-sky-400">{stats.totalUSD.toLocaleString()} <span className="text-[10px]">USD</span></p>
          </div>
          <div className="px-6 py-4 bg-emerald-50 text-emerald-700 rounded-3xl text-center border-b-8 border-emerald-500 min-w-[140px]">
            <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Total EGP</p>
            <p className="text-xl font-black">{stats.totalEGP.toLocaleString()} <span className="text-[10px]">EGP</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Guest / Folio</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Commission</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest no-print">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookingsWithCommission.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-all group text-xs">
                  <td className="px-8 py-4 font-black text-slate-900 uppercase tracking-tight">@{b.receptionistName}</td>
                  <td className="px-8 py-4">
                    <p className="font-black text-slate-900 uppercase">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                    <p className="text-[8px] font-bold text-sky-600 uppercase">UNIT {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <p className={`font-black text-sm ${b.currency === 'USD' ? 'text-sky-600' : 'text-emerald-600'}`}>
                       {b.commissionAmount.toLocaleString()} <span className="text-[8px] opacity-40">{b.currency}</span>
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    {b.commissionPaid ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Settled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500 font-black text-[9px] uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg w-fit">
                        <XCircle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right no-print">
                    <button 
                      onClick={() => onUpdateBooking(b.id, { commissionPaid: !b.commissionPaid })}
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${b.commissionPaid ? 'bg-slate-100 text-slate-500' : 'bg-slate-950 text-white shadow-md hover:bg-emerald-600'}`}
                    >
                      {b.commissionPaid ? 'Revoke' : 'Pay Out'}
                    </button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionManagement;
