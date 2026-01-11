
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Zap, Save, X, DollarSign, CheckCircle2 } from 'lucide-react';
import { ExtraService } from '../types';

interface ServicesManagementProps {
  services: ExtraService[];
  onAdd: (service: Omit<ExtraService, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ExtraService>) => void;
  onDelete: (id: string) => void;
}

const ServicesManagement: React.FC<ServicesManagementProps> = ({ services, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, isFree: false });

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

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border-4 border-slate-200 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter">Premium Amenities</h2>
          <p className="text-lg text-slate-600 font-bold mt-2">Global catalog for extra stay services.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-slate-950 text-white px-10 py-5 rounded-[2rem] font-black text-lg hover:bg-black transition-all shadow-2xl">
          <Plus className="w-7 h-7" /> Create Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-200 shadow-lg hover:border-sky-600 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-sky-50 rounded-2xl text-sky-600"><Zap className="w-8 h-8" /></div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(s.id); setFormData({ ...s }); setIsModalOpen(true); }} className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all border-2 border-slate-100"><Edit2 className="w-5 h-5" /></button>
                <button onClick={() => onDelete(s.id)} className="p-3 bg-rose-50 hover:bg-rose-700 hover:text-white rounded-xl transition-all border-2 border-rose-100"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-950 mb-2">{s.name}</h3>
            <div className="flex items-center justify-between mt-4">
              <p className="text-3xl font-black text-slate-900">{s.price.toLocaleString()} <span className="text-sm opacity-50">EGP</span></p>
              {s.isFree && <span className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-xl uppercase">Promo: Free</span>}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl animate-in zoom-in-95 border-4 border-slate-900">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-950 tracking-tighter">{editingId ? 'Modify Service' : 'New Service Asset'}</h3>
              <button onClick={closeModal}><X className="w-10 h-10 text-slate-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Service Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-6 rounded-[1.5rem] border-4 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none focus:border-sky-600 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Base Rate (EGP)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-6 rounded-[1.5rem] border-4 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none focus:border-sky-600 transition-all" />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Status</label>
                  <button type="button" onClick={() => setFormData({...formData, isFree: !formData.isFree})} className={`w-full p-6 rounded-[1.5rem] border-4 flex items-center justify-between font-black uppercase text-xs transition-all ${formData.isFree ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    {formData.isFree ? 'Free Service' : 'Paid Asset'}
                    {formData.isFree ? <CheckCircle2 className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-950 text-white py-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Commit Catalog Update</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
