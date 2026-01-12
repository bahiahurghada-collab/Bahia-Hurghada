
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Zap, Save, X, Search, CheckCircle2, History, BellRing } from 'lucide-react';
import { AppState, ExtraService, StayService, Booking } from '../types';

interface ServicesManagementProps {
  state: AppState;
  onAdd: (service: Omit<ExtraService, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ExtraService>) => void;
  onDelete: (id: string) => void;
  onFulfillService?: (bookingId: string, serviceId: string, isExtra: boolean) => void;
}

const ServicesManagement: React.FC<ServicesManagementProps> = ({ 
  state, onAdd, onUpdate, onDelete, onFulfillService 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, isFree: false });
  const [historySearch, setHistorySearch] = useState('');

  const services = state.services;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) onUpdate(editingId, formData);
    else onAdd(formData);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', price: 0, isFree: false });
  };

  const pendingOrders = useMemo(() => {
    const orders: any[] = [];
    state.bookings.forEach(b => {
      if (b.status === 'confirmed' || b.status === 'stay') {
        const apt = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || '?';
        const guest = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
        
        b.services.forEach(sid => {
          if (!(b.fulfilledServices || []).includes(sid)) {
            const sTemplate = state.services.find(s => s.id === sid);
            if (sTemplate) {
              orders.push({ id: `p-${b.id}-${sid}`, bookingId: b.id, displayId: b.displayId, serviceId: sid, name: sTemplate.name, apt, guest, isExtra: false });
            }
          }
        });

        (b.extraServices || []).forEach(es => {
          if (!es.isFulfilled) {
            orders.push({ id: `e-${b.id}-${es.id}`, bookingId: b.id, displayId: b.displayId, serviceId: es.id, name: es.name, apt, guest, isExtra: true });
          }
        });
      }
    });
    return orders;
  }, [state.bookings, state.services, state.apartments, state.customers]);

  const serviceHistory = useMemo(() => {
    const history: any[] = [];
    state.bookings.forEach(b => {
      const apt = state.apartments.find(a => a.id === b.apartmentId);
      const guest = state.customers.find(c => c.id === b.customerId);
      
      b.services.forEach(sid => {
        if ((b.fulfilledServices || []).includes(sid)) {
          const sTemplate = state.services.find(s => s.id === sid);
          if (sTemplate) {
            history.push({ id: `hist-${b.id}-${sid}`, name: sTemplate.name, price: sTemplate.price, date: b.startDate, isPaid: b.paymentStatus === 'Paid', apt: apt?.unitNumber || '?', guest: guest?.name || 'Guest', isExtra: false });
          }
        }
      });

      (b.extraServices || []).forEach(s => {
        if (s.isFulfilled) {
          history.push({ id: s.id, name: s.name, price: s.price, date: s.date, isPaid: s.isPaid, apt: apt?.unitNumber || '?', guest: guest?.name || 'Guest', isExtra: true });
        }
      });
    });
    return history.sort((a, b) => b.date.localeCompare(a.date));
  }, [state.bookings, state.services, state.apartments, state.customers]);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-950 rounded-2xl text-white shadow-xl shadow-slate-900/20"><Zap className="w-7 h-7" /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Amenity Fulfillment</h2>
            <p className="text-slate-400 font-bold mt-2 text-[10px] uppercase tracking-widest">Global Service Delivery Hub</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-sky-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-sky-700 transition-all border-b-4 border-sky-800">
          <Plus className="w-5 h-5 inline mr-2" /> Define New Amenity
        </button>
      </div>

      <div className="bg-amber-50 border-2 border-amber-100 rounded-[3rem] p-10">
         <div className="flex items-center gap-4 mb-8">
            <BellRing className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-black uppercase text-amber-900 tracking-tighter">Service Backlog</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrders.map(o => (
               <div key={o.id} className="bg-white p-6 rounded-3xl border-2 border-amber-100 flex items-center justify-between shadow-md hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-5">
                     <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-black text-xs">U-{o.apt}</div>
                     <div>
                        <p className="text-[13px] font-black text-slate-950 uppercase leading-none">{o.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{o.guest}</p>
                     </div>
                  </div>
                  <button onClick={() => onFulfillService?.(o.bookingId, o.serviceId, o.isExtra)} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg transition-all">
                     <CheckCircle2 className="w-5 h-5" />
                  </button>
               </div>
            ))}
            {pendingOrders.length === 0 && <div className="col-span-3 py-10 text-center opacity-30 font-black text-[10px] uppercase tracking-[0.3em]">All amenities delivered</div>}
         </div>
      </div>

      <div className="bg-white rounded-[4rem] border-2 border-slate-100 shadow-xl overflow-hidden">
         <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <History className="w-6 h-6 text-slate-950" />
               <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Delivery Archive</h3>
            </div>
            <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input placeholder="Search History..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-slate-100 font-bold text-[10px]" value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left font-bold">
               <thead>
                  <tr className="bg-slate-950 text-white text-[9px] uppercase tracking-[0.2em]">
                     <th className="px-10 py-6">Service Asset</th>
                     <th className="px-10 py-6">Unit / Guest</th>
                     <th className="px-10 py-6 text-right">Value (EGP)</th>
                     <th className="px-10 py-6 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {serviceHistory.filter(h => h.name.toLowerCase().includes(historySearch.toLowerCase())).map(h => (
                     <tr key={h.id} className="hover:bg-slate-50 transition-all text-[12px]">
                        <td className="px-10 py-6 uppercase font-black text-slate-950">{h.name}</td>
                        <td className="px-10 py-6">
                           <span className="font-black text-sky-600">UNIT {h.apt}</span> • {h.guest}
                        </td>
                        <td className="px-10 py-6 text-right font-black text-lg">{h.price.toLocaleString()}</td>
                        <td className="px-10 py-6 text-right">
                           <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${h.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {h.isPaid ? 'Settled' : 'Unpaid'}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full border-4 border-slate-950 animate-fade-in shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">{editingId ? 'Modify Amenity' : 'New Amenity'}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-10 h-10 text-slate-950" /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Amenity Name</label>
                   <input required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:border-slate-950 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Standard Price (EGP)</label>
                   <input required type="number" className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:border-slate-950 outline-none text-2xl text-sky-600" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <button type="submit" className="w-full py-8 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-sky-600 transition-all border-b-8 border-slate-900 mt-6">
                   <Save className="w-6 h-6 inline mr-2" /> Commit Asset
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
