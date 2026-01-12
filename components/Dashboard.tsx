
import React, { useMemo, useState } from 'react';
import { 
  Users, TrendingUp, LogIn, LogOut, Clock, 
  Droplets, CheckCircle2, ChevronRight, Zap, 
  CreditCard, Banknote, Plus
} from 'lucide-react';
import { AppState } from '../types';

interface DashboardProps {
  state: AppState;
  onAddService: any;
  onUpdateBooking: any;
  onOpenDetails: (id: string) => void;
  onTabChange?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onOpenDetails }) => {
  const [currency, setCurrency] = useState<'EGP' | 'USD'>('EGP');

  const stats = useMemo(() => {
    const totalUnits = state.apartments.length || 1;
    const occupied = state.bookings.filter(b => b.status === 'stay').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const arrivals = state.bookings.filter(b => b.startDate === todayStr).length;
    const departures = state.bookings.filter(b => b.endDate === todayStr).length;
    
    return {
      occupancy: Math.round((occupied / totalUnits) * 100),
      arrivals,
      departures,
      housekeeping: state.apartments.filter(a => a.status === 'MAINTENANCE').length
    };
  }, [state]);

  const recentMovements = useMemo(() => {
    return [...state.bookings]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .slice(0, 6);
  }, [state.bookings]);

  const guestServices = useMemo(() => {
    const services: any[] = [];
    state.bookings.forEach(b => {
      if (b.status === 'stay' || b.status === 'confirmed') {
        const apt = state.apartments.find(a => a.id === b.apartmentId);
        const cust = state.customers.find(c => c.id === b.customerId);
        
        b.services.forEach(sid => {
          const sTemplate = state.services.find(s => s.id === sid);
          if (sTemplate && !b.fulfilledServices.includes(sid)) {
            services.push({
              unit: apt?.unitNumber || '?',
              service: sTemplate.name,
              guest: cust?.name || 'Guest',
              price: sTemplate.price,
              currency: sTemplate.currency,
              status: b.paymentStatus === 'Paid' ? 'PAID' : 'UNPAID'
            });
          }
        });
      }
    });
    return services.slice(0, 5);
  }, [state.bookings, state.services, state.apartments, state.customers]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Operations Center</h2>
          <p className="text-slate-500 font-bold">Welcome back, team. Here's today's logistics overview.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <div className="px-4 py-2 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-slate-700">1 USD = {state.currentExchangeRate} EGP</span>
           </div>
           <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-700 flex items-center gap-2">
              <Clock className="w-3 h-3" /> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Occupancy Rate', value: `${stats.occupancy}%`, sub: 'Active Stays', icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Arrivals Today', value: stats.arrivals, sub: 'Expect check-ins', icon: LogIn, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Departures Today', value: stats.departures, sub: 'Expect check-outs', icon: LogOut, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Maintenance', value: stats.housekeeping, sub: 'Units offline', icon: Droplets, color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{s.label}</p>
              <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{s.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">{s.sub}</p>
            </div>
            <div className={`p-4 ${s.bg} ${s.color} rounded-2xl group-hover:scale-110 transition-transform`}>
              <s.icon className="w-7 h-7" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
             <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-500" />
                <h3 className="text-lg font-black uppercase text-slate-800 tracking-tighter">Live Movement Log</h3>
             </div>
             <button className="p-2 hover:bg-slate-100 rounded-lg transition-all"><ChevronRight className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b">
                     <th className="px-8 py-5">Date</th>
                     <th className="px-8 py-5">Status</th>
                     <th className="px-8 py-5">Guest</th>
                     <th className="px-8 py-5">Unit</th>
                     <th className="px-8 py-5 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {recentMovements.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onOpenDetails(b.id)}>
                      <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{b.startDate}</td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${b.status === 'confirmed' || b.status === 'stay' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                               <CheckCircle2 className="w-3 h-3" />
                            </div>
                            <span className={`text-[10px] font-black uppercase ${b.status === 'confirmed' || b.status === 'stay' ? 'text-emerald-600' : 'text-slate-400'}`}>
                               {b.status}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-sm font-black text-slate-800 uppercase leading-none">
                            {state.customers.find(c => c.id === b.customerId)?.name || 'Guest'}
                         </p>
                      </td>
                      <td className="px-8 py-5">
                         <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-black">
                            {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || '?'}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="px-6 py-2 bg-slate-800 text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all">
                            View
                         </button>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-sky-500" />
                    <h3 className="text-lg font-black uppercase text-slate-800 tracking-tighter">Guest Services</h3>
                 </div>
              </div>

              <div className="space-y-4 flex-1">
                 {guestServices.map((gs, i) => (
                   <div key={i} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">{gs.unit}</div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <p className="text-[12px] font-black text-slate-800 uppercase truncate">{gs.service}</p>
                            <p className="text-xs font-black text-slate-800">{gs.price.toLocaleString()} <span className="text-[8px] opacity-40">{gs.currency}</span></p>
                         </div>
                         <div className="flex justify-between items-center mt-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{gs.guest}</p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${gs.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{gs.status}</span>
                         </div>
                      </div>
                   </div>
                 ))}
                 {guestServices.length === 0 && (
                   <div className="py-10 text-center opacity-30 font-black text-[10px] uppercase">No pending services</div>
                 )}
              </div>
           </div>

           <div className="bg-[#1e293b] rounded-[2.5rem] p-8 text-slate-100 shadow-2xl relative overflow-hidden">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-sky-400" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <button className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all text-left">
                    <LogOut className="w-6 h-6 mb-3 text-rose-400" />
                    <p className="text-xs font-black uppercase">Operations</p>
                    <p className="text-[8px] font-bold opacity-40 mt-1">Movement Log</p>
                 </button>
                 <button className="bg-emerald-500 p-5 rounded-2xl hover:bg-emerald-600 transition-all text-left text-white shadow-lg shadow-emerald-500/20">
                    <CreditCard className="w-6 h-6 mb-3" />
                    <p className="text-xs font-black uppercase">Finance</p>
                    <p className="text-[8px] font-bold opacity-60 mt-1">Treasury</p>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
