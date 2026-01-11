
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users as UsersIcon, CalendarCheck, Banknote, Sparkles, Loader2, Clock, Zap, Plus, X, ConciergeBell, Eye, ShieldCheck, ArrowUpRight, Building2, CheckCircle, CreditCard, DollarSign
} from 'lucide-react';
import { AppState, Booking, BookingStatus, ExtraService } from '../types';
import { getSmartSummary } from '../services/geminiService';
import { PAYMENT_METHODS } from '../constants';

interface DashboardProps {
  state: AppState;
  onAddService: (bookingId: string, serviceId: string, paymentMethod: string, isPaid: boolean) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onOpenDetails: (id: string) => void;
  onTabChange?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAddService, onUpdateBooking, onOpenDetails, onTabChange }) => {
  const [smartSummary, setSmartSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [selectedStayForService, setSelectedStayForService] = useState<Booking | null>(null);
  const [servicePaymentMethod, setServicePaymentMethod] = useState('Cash');
  const [serviceIsPaid, setServiceIsPaid] = useState(true);

  const todayStr = '2026-01-07';
  const tomorrowStr = '2026-01-08';

  const totals = useMemo(() => {
    let egp = 0;
    let usd = 0;
    state.bookings.forEach(b => {
      if (b.status !== 'cancelled' && b.status !== 'maintenance') {
        if (b.currency === 'USD') usd += b.totalAmount;
        else egp += b.totalAmount;
      }
    });
    return { egp, usd };
  }, [state.bookings]);

  const stats = [
    { 
      label: 'Collected (EGP)', 
      value: `${totals.egp.toLocaleString()} EGP`, 
      icon: Banknote, 
      bg: 'bg-slate-900', 
      target: 'reports' 
    },
    { 
      label: 'Collected (USD)', 
      value: `${totals.usd.toLocaleString()} USD`, 
      icon: DollarSign, 
      bg: 'bg-sky-600', 
      target: 'reports' 
    },
    { label: 'Occupancy', value: `${state.bookings.filter(b => b.status === 'stay').length}/${state.apartments.length}`, icon: TrendingUp, bg: 'bg-white', target: 'calendar' },
    { label: 'Guest Pool', value: state.customers.length, icon: UsersIcon, bg: 'bg-white', target: 'customers' },
  ];

  // Current stays for the quick service add button
  const currentStays = useMemo(() => state.bookings.filter(b => b.status === 'stay'), [state.bookings]);

  // Services tracker logic
  const recentExtraServices = useMemo(() => {
    const list: Array<{guest: string, room: string, service: string, price: number, currency: string, date: string, isPaid: boolean, method: string}> = [];
    state.bookings.filter(b => b.extraServices && b.extraServices.length > 0).forEach(b => {
      const guest = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
      const room = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || 'N/A';
      b.extraServices.forEach(s => {
        list.push({
          guest,
          room,
          service: s.name,
          price: s.price,
          currency: b.currency,
          date: s.date,
          isPaid: s.isPaid,
          method: s.paymentMethod
        });
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [state.bookings, state.customers, state.apartments]);

  const logistics48H = useMemo(() => {
    return state.bookings.filter(b => {
      if (b.status === 'cancelled' || b.status === 'checked_out' || b.status === 'maintenance') return false;
      const isArrivalWindow = b.startDate === todayStr || b.startDate === tomorrowStr;
      const isDepartureWindow = b.endDate === todayStr || b.endDate === tomorrowStr;
      
      const isPendingArrival = isArrivalWindow && b.status === 'confirmed';
      const isActiveDeparture = isDepartureWindow && b.status === 'stay';
      
      return isPendingArrival || isActiveDeparture;
    }).map(b => {
      const targetDate = (b.startDate === todayStr || b.startDate === tomorrowStr) && b.status === 'confirmed' ? b.startDate : b.endDate;
      const dateObj = new Date(targetDate);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        ...b,
        logType: (b.startDate === todayStr || b.startDate === tomorrowStr) && b.status === 'confirmed' ? 'Arrival' : 'Departure',
        displayDate: `${dayName}, ${targetDate}`
      };
    }).sort((a, b) => a.logType === 'Arrival' ? -1 : 1);
  }, [state.bookings]);

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    const summary = await getSmartSummary(state);
    setSmartSummary(summary);
    setIsLoadingSummary(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">Operations Hub</h2>
          <p className="text-slate-400 mt-3 font-bold text-[10px] flex items-center gap-2 uppercase tracking-[0.4em]">
            <ShieldCheck className="w-5 h-5 text-sky-600" /> Bahia Hurghada Intelligence
          </p>
        </div>
        <button 
          onClick={handleGenerateSummary}
          disabled={isLoadingSummary}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black shadow-2xl hover:bg-black transition-all border-b-8 border-slate-950"
        >
          {isLoadingSummary ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-sky-400" />}
          SMART INSIGHTS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onTabChange?.(stat.target)}
            className={`${stat.bg} p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm group hover:translate-y-[-4px] hover:border-slate-900 transition-all text-left relative overflow-hidden`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-6 shadow-sm ${stat.bg === 'bg-white' ? 'bg-slate-50 text-slate-900' : 'bg-white/10 text-white'}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${stat.bg === 'bg-white' ? 'text-slate-400' : 'text-white/60'}`}>{stat.label}</p>
            <p className={`text-2xl font-black mt-1 tracking-tighter ${stat.bg === 'bg-white' ? 'text-slate-900' : 'text-white'}`}>{stat.value}</p>
            <ArrowUpRight className={`absolute top-6 right-6 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${stat.bg === 'bg-white' ? 'text-slate-900' : 'text-white'}`} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Service Task Board */}
          <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3"><ConciergeBell className="w-6 h-6 text-sky-600" /> Service tracker</h3>
              
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Quick Boost:</span>
                 <div className="flex gap-2 overflow-x-auto pb-1 max-w-[300px] scrollbar-hide">
                    {currentStays.map(s => (
                       <button 
                         key={s.id} 
                         onClick={() => setSelectedStayForService(s)} 
                         className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-900 rounded-xl font-black text-[11px] border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm group/btn"
                       >
                          <Plus className="w-3 h-3 group-hover/btn:scale-125 transition-transform" />
                          <span>{state.apartments.find(a => a.id === s.apartmentId)?.unitNumber}</span>
                       </button>
                    ))}
                 </div>
              </div>
            </div>
            <div className="space-y-4">
              {recentExtraServices.length > 0 ? recentExtraServices.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-sky-100 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white text-slate-900 border border-slate-100 flex items-center justify-center rounded-xl font-black text-xs shadow-sm">U-{s.room}</div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{s.guest} • {s.service}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.date} • {s.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{s.price.toLocaleString()} {s.currency}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${s.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                      {s.isPaid ? 'Settled' : 'Unpaid Folio'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No active requests</div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black tracking-tighter uppercase flex items-center gap-3"><Clock className="w-5 h-5 text-sky-400" /> Next 48H</h3>
              <span className="bg-white/10 text-[9px] font-black px-4 py-2 rounded-xl border border-white/5">{logistics48H.length} ACTIONS</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logistics48H.map(b => {
                const customer = state.customers.find(c => c.id === b.customerId);
                const apt = state.apartments.find(a => a.id === b.apartmentId);
                return (
                  <div key={b.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${b.logType === 'Arrival' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                          {b.logType}
                        </span>
                        <span className="text-sky-400 font-black text-[9px] uppercase tracking-widest">{b.displayDate}</span>
                      </div>
                      <p className="font-black text-base truncate text-white">{customer?.name} (Unit {apt?.unitNumber})</p>
                    </div>
                    <button onClick={() => onOpenDetails(b.id)} className="p-3 bg-white text-slate-900 rounded-xl hover:bg-sky-400 hover:text-white transition-all shadow-lg"><Eye className="w-4 h-4" /></button>
                  </div>
                );
              })}
              {logistics48H.length === 0 && <p className="col-span-2 text-center py-10 text-slate-600 font-black uppercase text-xs">Clear Schedule</p>}
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm h-fit">
          <h3 className="text-xl font-black text-slate-900 mb-10 uppercase tracking-tighter border-b border-slate-50 pb-6">System Events</h3>
          <div className="space-y-6">
            {state.bookings.slice(-8).reverse().map((b, i) => {
              const customer = state.customers.find(c => c.id === b.customerId);
              return (
                <button key={i} className="w-full flex gap-4 border-b border-slate-50 pb-6 last:border-0 group cursor-pointer text-left" onClick={() => onOpenDetails(b.id)}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110 ${b.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : (b.status === 'maintenance' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white')}`}>
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-slate-900 truncate">{customer?.name || 'Technical Block'}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{b.status} • Unit {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedStayForService && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl"><Plus className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Boost Stay Folio</h3>
               </div>
               <button onClick={() => setSelectedStayForService(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-8 h-8 text-slate-900" /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-slate-50 p-6 rounded-3xl">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Method</label>
                <select value={servicePaymentMethod} onChange={e => setServicePaymentMethod(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-white font-black text-sm outline-none">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Immediate Settlement</label>
                <button 
                  type="button" 
                  onClick={() => setServiceIsPaid(!serviceIsPaid)}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between font-black uppercase text-[10px] transition-all ${serviceIsPaid ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  {serviceIsPaid ? 'Settled Cash' : 'Owed on Checkout'}
                  {serviceIsPaid ? <CheckCircle className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {state.services.map(s => (
                 <button key={s.id} onClick={() => { onAddService(selectedStayForService.id, s.id, servicePaymentMethod, serviceIsPaid); }} className="w-full flex items-center justify-between p-6 bg-white rounded-2xl border-2 border-slate-50 hover:border-slate-900 transition-all group shadow-sm">
                   <div className="text-left">
                     <p className="font-black text-lg text-slate-900">{s.name}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Amenity Item</p>
                   </div>
                   <p className="font-black text-xl text-slate-900">{s.price.toLocaleString()} <span className="text-xs">EGP</span></p>
                 </button>
               ))}
            </div>
            <button onClick={() => setSelectedStayForService(null)} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Complete Folio Update</button>
          </div>
        </div>
      )}

      {smartSummary && (
        <div className="bg-sky-50 p-10 rounded-[3rem] border-2 border-sky-100 shadow-sm animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-sky-600" />
            <h3 className="text-2xl font-black text-slate-900 uppercase">Strategic Insight Report</h3>
          </div>
          <div className="prose prose-slate max-w-none text-slate-800 font-medium whitespace-pre-wrap leading-relaxed bg-white/50 p-8 rounded-3xl border border-white/50 shadow-inner">
            {smartSummary}
          </div>
          <button onClick={() => setSmartSummary(null)} className="mt-8 text-sky-600 font-black uppercase text-[10px] tracking-widest hover:underline">Dismiss Intelligence Report</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
