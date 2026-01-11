
import React, { useState, useMemo } from 'react';
import { 
  Building2, ConciergeBell, UserCheck, DoorOpen, Clock, Globe, Plus, Zap, 
  CheckCircle2, ArrowRight, Activity, LayoutGrid, ArrowUpRight, Wallet, X, LogOut, CalendarClock, RefreshCw, Coins, ArrowLeftRight, Calculator,
  // Fix: Added missing ChevronRight icon used on line 154
  ChevronRight
} from 'lucide-react';
import { AppState, Booking, BookingStatus } from '../types';

interface DashboardProps {
  state: AppState;
  onAddService: (bookingId: string, serviceId: string, paymentMethod: string, isPaid: boolean) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onOpenDetails: (id: string) => void;
  onTabChange?: (tab: string) => void;
  onQuickSettle?: (id: string) => void;
  onFulfillService?: (bookingId: string, serviceId: string, isExtra: boolean) => void;
  onUpdateRate?: (rate: number) => void;
  onRefreshRate?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAddService, onUpdateBooking, onOpenDetails, onTabChange, onQuickSettle, onFulfillService, onUpdateRate, onRefreshRate }) => {
  const [serviceModal, setServiceModal] = useState<{ open: boolean, bookingId: string }>({ open: false, bookingId: '' });
  const [newService, setNewService] = useState({ serviceId: '', paymentMethod: 'Cash', isPaid: true });
  
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [convertDir, setConvertDir] = useState<'USD2EGP' | 'EGP2USD'>('USD2EGP');

  const todayStr = new Date().toISOString().split('T')[0];

  const activeStays = useMemo(() => {
    return state.bookings.filter(b => b.status === 'stay');
  }, [state.bookings]);

  const stats = [
    { label: 'Total Units', value: state.apartments.length, icon: Building2, color: 'text-slate-950', bg: 'bg-slate-100', tab: 'apartments' },
    { label: 'Total Bookings', value: state.bookings.filter(b => b.status !== 'cancelled').length, icon: ConciergeBell, color: 'text-sky-600', bg: 'bg-sky-50', tab: 'bookings' },
    { label: 'In-House Now', value: activeStays.length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'calendar' },
    { label: 'Ready Units', value: state.apartments.length - state.bookings.filter(b => b.status === 'stay' || b.status === 'maintenance').length, icon: DoorOpen, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'apartments' },
  ];

  const convertedValue = useMemo(() => {
    if (convertDir === 'USD2EGP') return (convertAmount * state.currentExchangeRate).toFixed(2);
    return (convertAmount / state.currentExchangeRate).toFixed(4);
  }, [convertAmount, convertDir, state.currentExchangeRate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-bold">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
         <div className="bg-slate-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border-b-[16px] border-sky-600 transition-all hover:scale-[1.01]">
            <div className="absolute top-[-10%] right-[-10%] p-8 opacity-5 group-hover:opacity-10 transition-all duration-1000 rotate-12"><Coins className="w-64 h-64" /></div>
            <div className="relative z-10 space-y-8">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-white/10 rounded-2xl"><Globe className="w-5 h-5 text-sky-400" /></div>
                     <p className="text-[11px] font-black uppercase tracking-[0.4em] text-sky-400">Global Treasury Index</p>
                  </div>
                  <button onClick={onRefreshRate} className="p-3 bg-white/10 hover:bg-sky-500 rounded-2xl transition-all"><RefreshCw className="w-5 h-5" /></button>
               </div>
               <div className="flex items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                  <h3 className="text-5xl font-black tracking-tighter">1.00 <span className="text-[10px] opacity-40 uppercase">USD</span></h3>
                  <div className="w-10 h-1 bg-white/10 rounded-full"></div>
                  <div className="flex flex-col flex-1">
                     <input 
                       type="number" 
                       value={state.currentExchangeRate} 
                       onChange={(e) => onUpdateRate?.(parseFloat(e.target.value))}
                       className="bg-transparent text-5xl font-black tracking-tighter outline-none border-b-4 border-white/5 focus:border-sky-500 w-full transition-all"
                     />
                     <span className="text-[10px] font-black text-sky-400 uppercase text-right mt-3 tracking-widest">Internal Rate (EGP)</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><Calculator className="w-64 h-64" /></div>
            <div className="flex items-center gap-6 relative z-10">
               <div className="w-20 h-20 bg-slate-950 text-white rounded-3xl flex items-center justify-center shadow-2xl"><Calculator className="w-10 h-10 text-sky-400" /></div>
               <div className="min-w-[160px]">
                  <h4 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Internal FX</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Smart Multi-Currency Tool</p>
               </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row items-center gap-6 w-full relative z-10">
               <div className="flex-1 w-full space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">{convertDir === 'USD2EGP' ? 'Convert From USD' : 'Convert From EGP'}</label>
                  <input 
                    type="number" 
                    value={convertAmount || ''} 
                    onChange={(e) => setConvertAmount(parseFloat(e.target.value))}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-3xl outline-none focus:border-sky-500 transition-all shadow-inner"
                    placeholder="0.00"
                  />
               </div>
               
               <button onClick={() => setConvertDir(prev => prev === 'USD2EGP' ? 'EGP2USD' : 'USD2EGP')} className="p-6 bg-slate-950 text-white rounded-full hover:bg-sky-500 transition-all shadow-2xl active:scale-90 mt-4 md:mt-8">
                  <ArrowLeftRight className="w-7 h-7" />
               </button>

               <div className="flex-1 w-full space-y-3">
                  <label className="text-[10px] font-black uppercase text-emerald-500 ml-4 tracking-widest">Settlement Results</label>
                  <div className="w-full p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] font-black text-3xl text-emerald-700 flex justify-between items-center shadow-inner">
                     <span className="truncate">{convertedValue}</span>
                     <span className="text-[12px] font-black opacity-40 uppercase ml-4">{convertDir === 'USD2EGP' ? 'EGP' : 'USD'}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        {stats.map((s) => (
          <button key={s.label} onClick={() => onTabChange?.(s.tab)} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-slate-950 transition-all hover:shadow-xl">
            <div className={`p-5 rounded-2xl ${s.bg} ${s.color} transition-all group-hover:scale-110 shadow-inner`}>
              <s.icon className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <h3 className="text-3xl font-black text-slate-950 tracking-tighter">{s.value}</h3>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <Activity className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Live Occupancy</h3>
             </div>
             <button onClick={() => onTabChange?.('calendar')} className="p-3 bg-white text-slate-400 hover:text-sky-600 rounded-xl transition-all shadow-sm border border-slate-100"><ArrowUpRight className="w-5 h-5" /></button>
          </div>
          <div className="p-8 space-y-4 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {activeStays.length > 0 ? activeStays.map(b => {
               const customer = state.customers.find(c => c.id === b.customerId);
               const apartment = state.apartments.find(a => a.id === b.apartmentId);
               return (
                 <div key={b.id} onClick={() => onOpenDetails(b.id)} className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-sky-500 transition-all cursor-pointer flex items-center justify-between group shadow-sm hover:shadow-md">
                   <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">U-{apartment?.unitNumber}</div>
                     <div>
                       <p className="text-[13px] font-black text-slate-950 uppercase">{customer?.name}</p>
                       <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mt-1">Exp: {b.endDate}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="text-right">
                         <p className="text-[10px] font-black text-emerald-600">{b.totalAmount.toLocaleString()} {b.currency}</p>
                         <p className="text-[8px] font-black text-slate-400 uppercase">{b.platform}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-500 transition-all" />
                   </div>
                 </div>
               )
            }) : (
              <div className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No guests in-house</div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 rounded-[3.5rem] border-4 border-slate-900 shadow-2xl p-10 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-all rotate-12"><CalendarClock className="w-64 h-64" /></div>
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-4 bg-sky-500 rounded-3xl text-white shadow-xl shadow-sky-500/20"><CalendarClock className="w-8 h-8" /></div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">System Pulse</h3>
              </div>
              <div className="space-y-6">
                 <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1">Today's Folios</p>
                       <h4 className="text-3xl font-black">{state.bookings.filter(b => b.startDate === todayStr).length} Check-ins</h4>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center"><ArrowRight className="w-6 h-6 text-white/30" /></div>
                 </div>
                 <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1">Upcoming 48h</p>
                       <h4 className="text-3xl font-black">{state.bookings.filter(b => b.startDate > todayStr).length} Arrivals</h4>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center"><ArrowRight className="w-6 h-6 text-white/30" /></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
