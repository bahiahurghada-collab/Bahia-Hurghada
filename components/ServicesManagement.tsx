
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Zap, Save, X, DollarSign, CheckCircle2, History, Search, Building, User, Clock, CheckCircle, BellRing, MoveRight } from 'lucide-react';
import { AppState, ExtraService, StayService } from '../types';

interface ServicesManagementProps {
  state: AppState;
  onAdd: (service: Omit<ExtraService, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ExtraService>) => void;
  onDelete: (id: string) => void;
}

const ServicesManagement: React.FC<ServicesManagementProps> = ({ state, onAdd, onUpdate, onDelete }) => {
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

  // الخدمات المطلوبة في الحجوزات (الطلبات المعلقة للتجهيز)
  const pendingOrders = useMemo(() => {
    const orders: Array<{id: string, name: string, apt: string, guest: string, date: string, status: string}> = [];
    state.bookings.forEach(b => {
      if (b.status === 'confirmed' || b.status === 'stay' || b.status === 'pending') {
        const apt = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || '?';
        const guest = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
        
        b.services.forEach(sid => {
          const sTemplate = state.services.find(s => s.id === sid);
          if (sTemplate) {
            orders.push({
              id: `p-${b.id}-${sid}`,
              name: sTemplate.name,
              apt,
              guest,
              date: b.startDate,
              status: b.status
            });
          }
        });
      }
    });
    return orders;
  }, [state.bookings, state.services, state.apartments, state.customers]);

  const serviceHistory = useMemo(() => {
    const history: Array<StayService & { apartmentNumber: string, guestName: string }> = [];
    state.bookings.forEach(b => {
      const apt = state.apartments.find(a => a.id === b.apartmentId);
      const guest = state.customers.find(c => c.id === b.customerId);
      if (b.extraServices) {
        b.extraServices.forEach(s => {
          history.push({
            ...s,
            apartmentNumber: apt?.unitNumber || '?',
            guestName: guest?.name || 'Guest'
          });
        });
      }
    });
    return history.sort((a, b) => b.date.localeCompare(a.date));
  }, [state.bookings, state.apartments, state.customers]);

  const filteredHistory = useMemo(() => {
    return serviceHistory.filter(h => 
      h.apartmentNumber.includes(historySearch) || 
      h.name.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.guestName.toLowerCase().includes(historySearch.toLowerCase())
    );
  }, [serviceHistory, historySearch]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-950 rounded-2xl text-white shadow-xl"><Zap className="w-7 h-7" /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Amenities Catalog</h2>
            <p className="text-slate-400 font-bold mt-2 text-[10px] uppercase tracking-widest">Asset Management & Service Ops</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-sky-500 text-white px-8 py-4 rounded-[1.5rem] font-black hover:bg-sky-600 transition-all shadow-lg uppercase text-[12px] tracking-widest">
          <Plus className="w-5 h-5" /> Create Asset
        </button>
      </div>

      {/* Pending Fulfillment Section */}
      <div className="bg-amber-50 border border-amber-100 rounded-[3rem] p-8 shadow-sm">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500 text-white rounded-lg"><BellRing className="w-5 h-5" /></div>
            <h3 className="text-xl font-black uppercase text-amber-900 tracking-tighter">Pending Delivery Fulfillment</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map(o => (
               <div key={o.id} className="bg-white p-5 rounded-3xl border border-amber-100 flex items-center justify-between group shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-black text-xs border border-amber-200">U-{o.apt}</div>
                     <div>
                        <p className="text-[12px] font-black text-slate-950 uppercase tracking-tight leading-none">{o.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Guest: {o.guest}</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[7px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg uppercase">{o.status}</span>
                     <p className="text-[8px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">Stay Start: {o.date}</p>
                  </div>
               </div>
            ))}
            {pendingOrders.length === 0 && <div className="col-span-3 py-10 text-center opacity-30 font-black text-[10px] uppercase tracking-widest">All service requests fulfilled</div>}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-sky-500 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-sky-50 rounded-xl text-sky-600"><Zap className="w-5 h-5" /></div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(s.id); setFormData({ ...s }); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => onDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-1">{s.name}</h3>
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
              <p className="text-xl font-black text-slate-900">{s.price.toLocaleString()} <span className="text-[10px] opacity-40 uppercase">EGP</span></p>
              {s.isFree && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-lg uppercase">Promo: Free</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white"><History className="w-6 h-6" /></div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter leading-none">Delivered Service History</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Archived log of all successful deliveries</p>
               </div>
            </div>
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input placeholder="Filter Log..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-sky-500 outline-none font-bold text-[10px] transition-all" value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left font-bold border-collapse">
               <thead>
                  <tr className="bg-slate-50/30 text-slate-400 text-[8px] uppercase tracking-[0.2em] border-b border-slate-100">
                     <th className="px-8 py-5">Date</th>
                     <th className="px-8 py-5">Service</th>
                     <th className="px-8 py-5">Location</th>
                     <th className="px-8 py-5">Guest</th>
                     <th className="px-8 py-5 text-right">Accounting</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map(h => (
                     <tr key={h.id} className="hover:bg-slate-50/80 transition-all text-[11px]">
                        <td className="px-8 py-5"><span className="text-slate-900 font-black">{h.date}</span></td>
                        <td className="px-8 py-5"><span className="text-slate-950 font-black uppercase">{h.name}</span></td>
                        <td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase">Unit {h.apartmentNumber}</span></td>
                        <td className="px-8 py-5"><span className="text-slate-500 uppercase font-bold">{h.guestName}</span></td>
                        <td className="px-8 py-5 text-right">
                           <p className="text-lg font-black tracking-tighter text-slate-950">{h.price.toLocaleString()} EGP</p>
                           <span className={`text-[8px] font-black uppercase ${h.isPaid ? 'text-emerald-500' : 'text-rose-500'}`}>{h.isPaid ? 'Settled' : 'Unpaid'}</span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ServicesManagement;
