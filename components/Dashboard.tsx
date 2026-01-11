
import React, { useState, useMemo } from 'react';
import { 
  Building2, ConciergeBell, UserCheck, DoorOpen, Clock, Globe, Plus, Zap, 
  CheckCircle2, ArrowRight, Activity, LayoutGrid, ArrowUpRight, Wallet, X, LogOut, CalendarClock
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
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAddService, onUpdateBooking, onOpenDetails, onTabChange, onQuickSettle, onFulfillService }) => {
  const [serviceModal, setServiceModal] = useState<{ open: boolean, bookingId: string }>({ open: false, bookingId: '' });
  const [newService, setNewService] = useState({ serviceId: '', paymentMethod: 'Cash', isPaid: true });

  const todayStr = new Date().toISOString().split('T')[0];
  const next48Str = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  const nextCheckIn = useMemo(() => {
    return state.bookings
      .filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.startDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  }, [state.bookings, todayStr]);

  const activeStays = useMemo(() => {
    return state.bookings.filter(b => b.status === 'stay');
  }, [state.bookings]);

  // Next 48h Arrivals
  const arrivals48h = useMemo(() => {
    return state.bookings
      .filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.startDate >= todayStr && b.startDate <= next48Str)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [state.bookings, todayStr, next48Str]);

  // Next 48h Departures (Next Check-outs)
  const departures48h = useMemo(() => {
    return state.bookings
      .filter(b => b.status === 'stay' && b.endDate >= todayStr && b.endDate <= next48Str)
      .sort((a, b) => a.endDate.localeCompare(b.endDate));
  }, [state.bookings, todayStr, next48Str]);

  const stats = [
    { label: 'Total Units', value: state.apartments.length, icon: Building2, color: 'text-slate-950', bg: 'bg-slate-100', tab: 'apartments' },
    { label: 'Total Bookings', value: state.bookings.filter(b => b.status !== 'cancelled').length, icon: ConciergeBell, color: 'text-sky-600', bg: 'bg-sky-50', tab: 'bookings' },
    { label: 'In-House Now', value: activeStays.length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'calendar' },
    { label: 'Ready Units', value: state.apartments.length - state.bookings.filter(b => b.status === 'stay' || b.status === 'maintenance').length, icon: DoorOpen, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'apartments' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-bold">
      {/* 1. Interactive Stats - Quick Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onTabChange?.(stat.tab)}
            className="bg-white p-8 rounded-[3rem] border-b-8 border-slate-200 shadow-sm group hover:border-sky-500 hover:scale-[1.03] transition-all text-left relative overflow-hidden"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:bg-slate-950 group-hover:text-white transition-colors`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
            <p className={`text-4xl font-black mt-2 tracking-tighter ${stat.color}`}>{stat.value}</p>
            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all text-sky-500" />
          </button>
        ))}
      </div>

      {/* 2. Spotlight: Next Check-in Priority */}
      <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border-b-[12px] border-sky-600">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><Building2 className="w-64 h-64" /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-3 h-3 rounded-full bg-sky-500 animate-ping"></span>
            <p className="text-sky-400 font-black text-[11px] uppercase tracking-[0.5em]">Spotlight: Immediate Check-in</p>
          </div>
          
          {nextCheckIn ? (
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
              <div className="space-y-4">
                <h3 className="text-6xl font-black tracking-tighter uppercase leading-none">
                  {state.customers.find(c => c.id === nextCheckIn.customerId)?.name}
                </h3>
                <div className="flex flex-wrap gap-6 mt-8">
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white"><LayoutGrid className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-500">Unit Number</p>
                      <p className="text-xl font-black">U-{state.apartments.find(a => a.id === nextCheckIn.apartmentId)?.unitNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><Clock className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-500">Scheduled Arrival</p>
                      <p className="text-xl font-black">{nextCheckIn.startDate} @ {nextCheckIn.checkInTime || '14:00'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onOpenDetails(nextCheckIn.id)}
                className="bg-white text-slate-950 px-10 py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-sky-500 hover:text-white transition-all flex items-center gap-3"
              >
                Proceed to Check-in <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-600 font-black uppercase tracking-widest text-2xl">No arrivals on the horizon</div>
          )}
        </div>
      </div>

      {/* 3. The 48-Hour Radar (Arrivals & Departures) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Next 48h Arrivals */}
         <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-950 flex items-center gap-3">
                <CalendarClock className="w-7 h-7 text-sky-500" /> Arrivals (Next 48H)
              </h3>
              <span className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-[10px] font-black uppercase">{arrivals48h.length} EXPECTED</span>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {arrivals48h.map(b => (
                <div key={b.id} onClick={() => onOpenDetails(b.id)} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-sky-500 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-sm">
                       <span className="text-[8px] font-black text-slate-400 uppercase">Unit</span>
                       <span className="text-sm font-black text-slate-950">{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{b.startDate} • {b.platform}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {arrivals48h.length === 0 && <div className="py-10 text-center text-slate-300 font-black uppercase text-[10px]">No arrivals in the next 48h</div>}
            </div>
         </div>

         {/* Next Check-outs (Departures) */}
         <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-950 flex items-center gap-3">
                <LogOut className="w-7 h-7 text-rose-500" /> Departures (Next 48H)
              </h3>
              <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase">{departures48h.length} CHECK-OUTS</span>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {departures48h.map(b => (
                <div key={b.id} onClick={() => onOpenDetails(b.id)} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-rose-500 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-sm">
                       <span className="text-[8px] font-black text-slate-400 uppercase">Unit</span>
                       <span className="text-sm font-black text-slate-950">{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{state.customers.find(c => c.id === b.customerId)?.name}</p>
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Ending: {b.endDate}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {departures48h.length === 0 && <div className="py-10 text-center text-slate-300 font-black uppercase text-[10px]">No departures in the next 48h</div>}
            </div>
         </div>
      </div>

      {/* 4. In-House Operations & Room Service */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-950 flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-emerald-600" /> All In-House Guests
            </h3>
            <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase">{activeStays.length} ACTIVE ROOMS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeStays.map(b => (
              <div key={b.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-slate-300 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase truncate max-w-[150px]">
                      {state.customers.find(c => c.id === b.customerId)?.name}
                    </h4>
                    <p className="text-[10px] font-black text-sky-600 uppercase mt-1">Room U-{state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Balance Status</p>
                    <p className={`text-sm font-black ${b.totalAmount - b.paidAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {b.totalAmount - b.paidAmount > 0 ? `${(b.totalAmount - b.paidAmount).toLocaleString()} ${b.currency}` : 'SETTLED'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  {/* Fixed: Line 209: Replaced 'boolean' type name with 'true' value */}
                  <button onClick={() => setServiceModal({ open: true, bookingId: b.id })} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[8px] tracking-widest hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Plus className="w-3 h-3" /> Room Service
                  </button>
                  {b.totalAmount - b.paidAmount > 0 && (
                    <button onClick={() => onQuickSettle?.(b.id)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[8px] tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Settle All
                    </button>
                  )}
                </div>
              </div>
            ))}
            {activeStays.length === 0 && <div className="col-span-2 py-12 text-center text-slate-400 uppercase text-xs">No active stays at the moment</div>}
          </div>
        </div>

        {/* Rapid Navigation Actions */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between">
           <div className="space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-950 flex items-center gap-3">
                <Activity className="w-6 h-6 text-sky-500" /> System Pulse
              </h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">Direct system shortcuts for faster management flow.</p>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => onTabChange?.('apartments')} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-3xl transition-all flex flex-col items-center gap-3 group">
                 <Building2 className="w-6 h-6 text-slate-400 group-hover:text-sky-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Inventory</span>
              </button>
              <button onClick={() => onTabChange?.('bookings')} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-3xl transition-all flex flex-col items-center gap-3 group">
                 <ConciergeBell className="w-6 h-6 text-slate-400 group-hover:text-sky-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Folios</span>
              </button>
              <button onClick={() => onTabChange?.('calendar')} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-3xl transition-all flex flex-col items-center gap-3 group">
                 <Clock className="w-6 h-6 text-slate-400 group-hover:text-sky-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Timeline</span>
              </button>
              <button onClick={() => onTabChange?.('reports')} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-3xl transition-all flex flex-col items-center gap-3 group">
                 <Wallet className="w-6 h-6 text-slate-400 group-hover:text-sky-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Finance</span>
              </button>
           </div>
        </div>
      </div>

      {/* Room Service Modal */}
      {serviceModal.open && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[3000] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border-4 border-slate-950 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 text-sky-600">
                   <Zap className="w-8 h-8" />
                   <h3 className="text-2xl font-black tracking-tighter uppercase">Room Service</h3>
                </div>
                <button onClick={() => setServiceModal({ open: false, bookingId: '' })} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-950"><X className="w-8 h-8" /></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Amenity</label>
                   <select className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-sm" value={newService.serviceId} onChange={e => setNewService({...newService, serviceId: e.target.value})}>
                      <option value="">Choose Service...</option>
                      {state.services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} EGP)</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Payment Method</label>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setNewService({...newService, isPaid: true})} className={`py-4 rounded-xl font-black uppercase text-[10px] border-2 transition-all ${newService.isPaid ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>Paid Now</button>
                      <button onClick={() => setNewService({...newService, isPaid: false})} className={`py-4 rounded-xl font-black uppercase text-[10px] border-2 transition-all ${!newService.isPaid ? 'bg-rose-500 border-rose-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>Charge Folio</button>
                   </div>
                </div>
                <button onClick={() => { 
                   if(!newService.serviceId) return;
                   onAddService(serviceModal.bookingId, newService.serviceId, newService.paymentMethod, newService.isPaid);
                   setServiceModal({ open: false, bookingId: '' });
                }} className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-sky-600 transition-all shadow-xl">Confirm Delivery</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
