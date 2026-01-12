
import React, { useState } from 'react';
import { Plus, Home, Eye, MessageCircle, X, Trash2, Edit2, Building, Bed, Bath, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { Apartment, UserRole, Owner } from '../types';
import { VIEWS } from '../constants';

interface ApartmentsProps {
  apartments: Apartment[];
  owners: Owner[];
  userRole: UserRole;
  onAdd: (apt: Omit<Apartment, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Apartment>) => void;
  onDelete: (id: string) => void;
}

const Apartments: React.FC<ApartmentsProps> = ({ apartments, owners, userRole, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const isAdmin = userRole === 'admin';

  const [formData, setFormData] = useState({
    unitNumber: '', floor: 0, rooms: 2, baths: 2, view: VIEWS[0], dailyPrice: 0,
    monthlyPrice: 0, maxDiscount: 0, images: [] as string[], ownerId: ''
  });

  const [tempImageUrl, setTempImageUrl] = useState('');

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTempImageUrl('');
    setFormData({ unitNumber: '', floor: 0, rooms: 2, baths: 2, view: VIEWS[0], dailyPrice: 0, monthlyPrice: 0, maxDiscount: 0, images: [], ownerId: '' });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      images: tempImageUrl ? [tempImageUrl] : formData.images
    };
    if (editingId) onUpdate(editingId, finalData); 
    else onAdd(finalData);
    handleCloseModal();
  };

  return (
    <div className="space-y-10 pb-32 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Units Management</h2>
          <p className="text-slate-500 font-bold mt-2">Manage unit availability, pricing, and details.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-[#1e293b] text-slate-100 px-10 py-4 rounded-2xl font-black hover:bg-sky-600 transition-all shadow-xl uppercase text-xs tracking-widest">
            <Plus className="w-5 h-5" /> Add New Unit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {apartments.map(apt => {
          const status = apt.status || 'AVAILABLE';
          return (
            <div key={apt.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="relative h-64 bg-[#2a3441] overflow-hidden">
                <img 
                  src={apt.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                  alt={`Unit ${apt.unitNumber}`}
                />
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b]/80 via-transparent to-transparent"></div>
                
                <div className="absolute top-6 right-6">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                     status === 'OCCUPIED' ? 'bg-[#1e293b] text-white' : 
                     status === 'MAINTENANCE' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                   }`}>
                     {status}
                   </span>
                </div>
                <div className="absolute bottom-8 left-8 text-white z-10">
                  <h4 className="text-4xl font-black tracking-tighter uppercase">Unit {apt.unitNumber}</h4>
                  <p className="text-[10px] font-black uppercase opacity-80 flex items-center gap-2 mt-2">
                     <Eye className="w-3 h-3" /> Floor {apt.floor} • {apt.view}
                  </p>
                </div>
                <div className="absolute bottom-8 right-8 text-white text-right z-10">
                   <p className="text-3xl font-black tracking-tighter">{apt.dailyPrice.toLocaleString()} <span className="text-[10px] opacity-60">EGP</span></p>
                   <p className="text-[9px] font-black uppercase opacity-60">Per Night</p>
                </div>
              </div>
              
              <div className="p-8 space-y-8 flex-1 flex flex-col">
                 <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-8">
                    <div className="text-center">
                       <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-colors">
                          <LayoutGrid className="w-5 h-5" />
                       </div>
                       <p className="text-xs font-black text-slate-800 uppercase leading-none">{apt.rooms} Rooms</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                       <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:text-sky-500 group-hover:bg-sky-50 transition-colors">
                          <Bed className="w-5 h-5" />
                       </div>
                       <p className="text-xs font-black text-slate-800 uppercase leading-none">{apt.rooms + 1} Beds</p>
                    </div>
                    <div className="text-center">
                       <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:text-rose-500 group-hover:bg-rose-50 transition-colors">
                          <Bath className="w-5 h-5" />
                       </div>
                       <p className="text-xs font-black text-slate-800 uppercase leading-none">{apt.baths || 2} Baths</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setEditingId(apt.id); setFormData(apt as any); setTempImageUrl(apt.images[0] || ''); setIsModalOpen(true); }} className="py-4 bg-slate-50 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                       <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button className="py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                       <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 max-h-[95vh] flex flex-col border-4 border-slate-800 overflow-hidden">
            <div className="p-10 shrink-0 flex justify-between items-center bg-slate-50 border-b border-slate-100">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-slate-100"><Building className="w-6 h-6" /></div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{editingId ? 'Edit Folio' : 'Asset Registration'}</h3>
               </div>
               <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-800"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Unit Number</label>
                  <input required placeholder="e.g. 204" value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-800 outline-none bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Bed Inventory</label>
                  <input required type="number" value={formData.rooms || ''} onChange={e => setFormData({...formData, rooms: Number(e.target.value)})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-800 outline-none bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Bath Inventory</label>
                  <input required type="number" value={formData.baths || ''} onChange={e => setFormData({...formData, baths: Number(e.target.value)})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-800 outline-none bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nightly Rate (EGP)</label>
                  <input required type="number" value={formData.dailyPrice || ''} onChange={e => setFormData({...formData, dailyPrice: Number(e.target.value)})} className="w-full p-5 rounded-2xl border-2 border-slate-200 font-black text-2xl text-slate-800 outline-none bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Landscape View</label>
                  <select value={formData.view} onChange={e => setFormData({...formData, view: e.target.value})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-800 outline-none bg-slate-50 focus:bg-white transition-all">
                    {VIEWS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Floor Number</label>
                  <input required type="number" value={formData.floor} onChange={e => setFormData({...formData, floor: Number(e.target.value)})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-800 outline-none bg-slate-50 focus:bg-white transition-all" />
                </div>
              </div>

              {/* New Image URL Field */}
              <div className="space-y-2 bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <ImageIcon className="w-5 h-5 text-sky-500" />
                  <h4 className="text-sm font-black uppercase text-slate-800 tracking-widest">Media Asset</h4>
                </div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Main Image URL</label>
                <input 
                  placeholder="https://images.unsplash.com/photo-..." 
                  value={tempImageUrl} 
                  onChange={e => setTempImageUrl(e.target.value)} 
                  className="w-full p-5 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-sky-500 outline-none bg-white transition-all" 
                />
                <p className="text-[9px] font-bold text-slate-400 mt-2 ml-4">Provide a high-resolution direct link for the best presentation.</p>
              </div>

              <button type="submit" className="w-full py-10 bg-[#1e293b] text-slate-100 font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl hover:bg-emerald-600 transition-all border-b-8 border-slate-900">
                Commit Asset to Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apartments;
