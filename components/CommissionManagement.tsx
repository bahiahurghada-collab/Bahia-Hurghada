
import React, { useMemo } from 'react';
import { BadgePercent, CheckCircle2, XCircle, TrendingUp, Wallet, ArrowRight, UserCircle } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Sales Commission</h2>
          <p className="text-slate-400 font-bold mt-2 text-[10px] uppercase tracking-widest">Monitor staff payouts and platform fees</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-slate-950 text-white rounded-2xl text-center border-b-4 border-sky-500">
            <p className="text-[8px] font-black uppercase opacity-50 tracking-widest">Total Accumulation</p>
            <p className="text-lg font-black">{stats.totalEGP.toLocaleString()} <span className="text-[8px]">EGP</span></p>
          </div>
          <div className="px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl text-center border border-rose-100">
            <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Pending Payouts</p>
            <p className="text-lg font-black">{(stats.totalEGP - stats.paidEGP).toLocaleString()} <span className="text-[8px]">EGP</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reservation</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Channel</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Commission</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookingsWithCommission.map(b => {
              const guest = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
              const unit = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || 'N/A';
              return (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors group text-xs">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100"><UserCircle className="w-5 h-5" /></div>
                       <p className="font-black text-slate-900 uppercase tracking-tight">@{b.receptionistName || 'Admin'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-black text-slate-900 truncate uppercase">{guest}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Unit {unit} • {b.startDate}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">{b.platform}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <p className="font-black text-sm text-rose-600">{b.commissionAmount.toLocaleString()} <span className="text-[8px] opacity-40">{b.currency}</span></p>
                  </td>
                  <td className="px-8 py-4">
                    {b.commissionPaid ? (
                      <div className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-500 font-black text-[9px] uppercase tracking-widest">
                        <XCircle className="w-3.5 h-3.5" /> Due
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => onUpdateBooking(b.id, { commissionPaid: !b.commissionPaid })}
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${b.commissionPaid ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'}`}
                    >
                      {b.commissionPaid ? 'Reverse' : 'Release Pay'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {bookingsWithCommission.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center font-black text-slate-300 uppercase tracking-[0.2em]">No commission data available for this period</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionManagement;
