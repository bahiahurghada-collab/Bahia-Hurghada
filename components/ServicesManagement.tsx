
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Zap, Save, X, DollarSign, CheckCircle2, History, Search, Building, User, Clock, CheckCircle } from 'lucide-react';
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
            <p className="text-slate-400 font-bold mt-2 text-[10px] uppercase tracking-widest">Global Asset & Service Management</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-sky-500 text-white px-8 py-4 rounded-[1.5rem] font-black hover:bg-sky-600 transition-all shadow-lg uppercase text-[12px] tracking-widest">
          <Plus className="w-5 h-5" /> Create Asset
        </button>
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

      {/* Service Operations History */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white"><History className="w-6 h-6" /></div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter leading-none">Service History Log</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Tracking for all Guest requests</p>
               </div>
            </div>
            
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                  placeholder="Filter by Room, Service, Guest..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-sky-500 outline-none font-bold text-[10px] transition-all"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
               />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left font-bold border-collapse">
               <thead>
                  <tr className="bg-slate-50/30 text-slate-400 text-[8px] uppercase tracking-[0.2em] border-b border-slate-100">
                     <th className="px-8 py-5">Value Date</th>
                     <th className="px-8 py-5">Asset / Request</th>
                     <th className="px-8 py-5">Location / Room</th>
                     <th className="px-8 py-5">Guest Profile</th>
                     <th className="px-8 py-5 text-right">Accounting Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map(h => (
                     <tr key={h.id} className="hover:bg-slate-50/80 transition-all text-[11px]">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-300" />
                              <span className="text-slate-900 font-black">{h.date}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                              <span className="text-slate-950 font-black uppercase">{h.name}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg w-fit">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-600 uppercase">Unit {h.apartmentNumber}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-300" />
                              <span className="text-slate-500 truncate max-w-[150px] uppercase font-bold">{h.guestName}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex flex-col items-end">
                              <p className="text-lg font-black tracking-tighter text-slate-950">{h.price.toLocaleString()} <span className="text-[9px] font-bold opacity-30">EGP</span></p>
                              <div className={`flex items-center gap-1 text-[8px] font-black uppercase ${h.isPaid ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {h.isPaid ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                 {h.isPaid ? 'Settled' : 'Room Charge'}
                              </div>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                     <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No operation history found</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl animate-in zoom-in-95 border-2 border-slate-950">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">{editingId ? 'Modify Asset' : 'New Service Asset'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-8 h-8 text-slate-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Service Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none focus:border-sky-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Base Price (EGP)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none focus:border-sky-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Promotion</label>
                  <button type="button" onClick={() => setFormData({...formData, isFree: !formData.isFree})} className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between font-black uppercase text-[10px] transition-all ${formData.isFree ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    {formData.isFree ? 'Free Service' : 'Paid Asset'}
                    {formData.isFree ? <CheckCircle2 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-sky-600 transition-all">Save Asset Update</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
