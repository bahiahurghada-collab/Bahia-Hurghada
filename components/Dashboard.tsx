
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users as UsersIcon, CalendarCheck, Banknote, Sparkles, Loader2, Clock, Zap, Plus, X, ConciergeBell, Eye, ShieldCheck, ArrowUpRight, Building2, CheckCircle, CreditCard, DollarSign, UserPlus, ShoppingCart, UserCheck, ArrowRight
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
    { label: 'EGP Collected', value: `${totals.egp.toLocaleString()} EGP`, icon: Banknote, bg: 'bg-slate-900', target: 'reports' },
    { label: 'USD Collected', value: `${totals.usd.toLocaleString()} USD`, icon: DollarSign, bg: 'bg-sky-600', target: 'reports' },
    { label: 'Occupancy', value: `${state.bookings.filter(b => b.status === 'stay').length}/${state.apartments.length}`, icon: TrendingUp, bg: 'bg-white', target: 'calendar' },
    { label: 'Total Guests', value: state.customers.length, icon: UsersIcon, bg: 'bg-white', target: 'customers' },
  ];

  const currentStays = useMemo(() => state.bookings.filter(b => b.status === 'stay'), [state.bookings]);

  const recentExtraServices = useMemo(() => {
    const list: Array<{guest: string, room: string, service: string, price: number, currency: string, date: string, isPaid: boolean, method: string}> = [];
    state.bookings.filter(b => b.extraServices && b.extraServices.length > 0).forEach(b => {
      const guest = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
      const room = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || 'N/A';
      b.extraServices.forEach(s => {
        list.push({ guest, room, service: s.name, price: s.price, currency: b.currency, date: s.date, isPaid: s.isPaid, method: s.paymentMethod });
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [state.bookings, state.customers, state.apartments]);

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    const summary = await getSmartSummary(state);
    setSmartSummary(summary);
    setIsLoadingSummary(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">Management Hub</h2>
          <p className="text-slate-400 mt-3 font-bold text-[10px] flex items-center gap-2 uppercase tracking-[0.4em]">
            <ShieldCheck className="w-5 h-5 text-sky-600" /> Bahia Hurghada Intelligence
          </p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="flex items-center gap-3 bg-white text-slate-900 px-6 py-4 rounded-2xl font-black shadow-sm hover:shadow-md transition-all border border-slate-200">
              {isLoadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-sky-500" />}
              AI INSIGHTS
            </button>
        </div>
      </div>

      {/* Quick Access Grid - تكملة "اضافة ا..." */}
      <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
             <Plus className="w-40 h-40 text-white" />
          </div>
          <div className="relative z-10">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div>
                <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">Operational Quick Actions</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button onClick={() => onTabChange?.('bookings')} className="group bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-sky-500 transition-all flex flex-col gap-4 text-left">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <ConciergeBell className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <p className="text-white font-black text-sm uppercase">Add Reservation</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase mt-1 group-hover:text-white/80">New Stay Entry</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white ml-auto" />
                </button>

                <button onClick={() => onTabChange?.('apartments')} className="group bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-emerald-600 transition-all flex flex-col gap-4 text-left">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Building2 className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <p className="text-white font-black text-sm uppercase">Add New Unit</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase mt-1 group-hover:text-white/80">Expand Inventory</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white ml-auto" />
                </button>

                <button onClick={() => onTabChange?.('maintenance')} className="group bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-rose-600 transition-all flex flex-col gap-4 text-left">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <ShoppingCart className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <p className="text-white font-black text-sm uppercase">Add Expense</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase mt-1 group-hover:text-white/80">Log Maintenance</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white ml-auto" />
                </button>

                <button onClick={() => onTabChange?.('team')} className="group bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-indigo-600 transition-all flex flex-col gap-4 text-left">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <UserPlus className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <p className="text-white font-black text-sm uppercase">Add Staff</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase mt-1 group-hover:text-white/80">Security Access</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white ml-auto" />
                </button>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button key={i} onClick={() => onTabChange?.(stat.target)} className={`${stat.bg} p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm group hover:translate-y-[-4px] transition-all text-left relative overflow-hidden`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-6 shadow-sm ${stat.bg === 'bg-white' ? 'bg-slate-50 text-slate-900' : 'bg-white/10 text-white'}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${stat.bg === 'bg-white' ? 'text-slate-400' : 'text-white/60'}`}>{stat.label}</p>
            <p className={`text-2xl font-black mt-1 tracking-tighter ${stat.bg === 'bg-white' ? 'text-slate-900' : 'text-white'}`}>{stat.value}</p>
            <ArrowUpRight className={`absolute top-6 right-6 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${stat.bg === 'bg-white' ? 'text-slate-900' : 'text-white'}`} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3"><ConciergeBell className="w-6 h-6 text-sky-600" /> Active Service Tracker</h3>
              <div className="flex gap-2">
                {currentStays.map(s => (
                   <button key={s.id} onClick={() => setSelectedStayForService(s)} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all">
                      U-{state.apartments.find(a => a.id === s.apartmentId)?.unitNumber}
                   </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {recentExtraServices.length > 0 ? recentExtraServices.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
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
                <div className="py-10 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No active stay requests</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm h-fit">
          <h3 className="text-xl font-black text-slate-900 mb-10 uppercase tracking-tighter border-b border-slate-50 pb-6">System Log</h3>
          <div className="space-y-6">
            {state.bookings.slice(-6).reverse().map((b, i) => (
              <button key={i} className="w-full flex gap-4 border-b border-slate-50 pb-6 last:border-0 group cursor-pointer text-left" onClick={() => onOpenDetails(b.id)}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${b.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white'}`}>
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-black text-slate-900 truncate">{state.customers.find(c => c.id === b.customerId)?.name || 'Technical Block'}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{b.status} • Unit {state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedStayForService && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Add Service to Folio</h3>
               <button onClick={() => setSelectedStayForService(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-8 h-8 text-slate-900" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Payment Method</label>
                <select value={servicePaymentMethod} onChange={e => setServicePaymentMethod(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-white font-black text-sm outline-none">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Settlement</label>
                <button onClick={() => setServiceIsPaid(!serviceIsPaid)} className={`w-full p-4 rounded-xl border flex items-center justify-between font-black uppercase text-[10px] transition-all ${serviceIsPaid ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>
                  {serviceIsPaid ? 'Settled' : 'Unpaid'}
                  {serviceIsPaid ? <CheckCircle className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
               {state.services.map(s => (
                 <button key={s.id} onClick={() => { onAddService(selectedStayForService.id, s.id, servicePaymentMethod, serviceIsPaid); setSelectedStayForService(null); }} className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-slate-900 transition-all group">
                   <div className="text-left">
                     <p className="font-black text-lg text-slate-900">{s.name}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Select to Add</p>
                   </div>
                   <p className="font-black text-xl text-slate-900">{s.price.toLocaleString()} <span className="text-xs">EGP</span></p>
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}

      {smartSummary && (
        <div className="bg-sky-50 p-10 rounded-[3rem] border-2 border-sky-100 shadow-sm animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-sky-600" />
            <h3 className="text-2xl font-black text-slate-900 uppercase">Strategic Insight Report</h3>
          </div>
          <div className="prose prose-slate max-w-none text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
            {smartSummary}
          </div>
          <button onClick={() => setSmartSummary(null)} className="mt-8 text-sky-600 font-black uppercase text-[10px] tracking-widest hover:underline">Dismiss Report</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
