
import React, { useMemo } from 'react';
import { BadgePercent, CheckCircle2, XCircle, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
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
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">Sales Commission</h2>
          <p className="text-slate-500 font-bold mt-2">Monitor payouts and platform fees for all reservations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-6 py-4 bg-slate-950 text-white rounded-2xl text-center">
            <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Total Commission (EGP)</p>
            <p className="text-xl font-black">{stats.totalEGP.toLocaleString()}</p>
          </div>
          <div className="px-6 py-4 bg-sky-600 text-white rounded-2xl text-center">
            <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Unpaid (EGP)</p>
            <p className="text-xl font-black">{(stats.totalEGP - stats.paidEGP).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-10 py-8 text-xs font-black text-slate-500 uppercase tracking-widest">Reservation</th>
              <th className="px-10 py-8 text-xs font-black text-slate-500 uppercase tracking-widest">Source</th>
              <th className="px-10 py-8 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Commission</th>
              <th className="px-10 py-8 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-10 py-8 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookingsWithCommission.map(b => {
              const guest = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
              const unit = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || 'N/A';
              return (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-10 py-6">
                    <p className="font-black text-lg text-slate-900">{guest}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Unit {unit} • {b.startDate}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{b.platform}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="font-black text-lg text-rose-600">{b.commissionAmount.toLocaleString()} <span className="text-[10px] opacity-40">{b.currency}</span></p>
                  </td>
                  <td className="px-10 py-6">
                    {b.commissionPaid ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Paid
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest animate-pulse">
                        <XCircle className="w-4 h-4" /> Unpaid
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => onUpdateBooking(b.id, { commissionPaid: !b.commissionPaid })}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${b.commissionPaid ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700'}`}
                    >
                      {b.commissionPaid ? 'Mark Unpaid' : 'Mark as Paid'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {bookingsWithCommission.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center font-black text-slate-300 uppercase tracking-[0.2em]">No commission records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionManagement;
