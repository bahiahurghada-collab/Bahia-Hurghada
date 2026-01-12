
import React, { useState } from 'react';
import { Plus, Home, Eye, MessageCircle, X, Trash2, Loader2, Edit2, Building, Info, Briefcase } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const isAdmin = userRole === 'admin';

  const [formData, setFormData] = useState({
    unitNumber: '',
    floor: 0,
    rooms: 1,
    view: VIEWS[0],
    dailyPrice: 0,
    monthlyPrice: 0,
    maxDiscount: 0,
    images: [] as string[],
    ownerId: ''
  });

  const handleDailyPriceChange = (val: number) => {
    const suggestedMonthly = Math.round(val * 30 * 0.9);
    setFormData(prev => ({ ...prev, dailyPrice: val, monthlyPrice: suggestedMonthly }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsProcessing(true);
      const newImages: string[] = [];
      // Fix: Explicitly cast Array.from(files) to File[] to ensure 'file' is recognized as a Blob for FileReader methods.
      for (const file of Array.from(files) as File[]) {
        const reader = new FileReader();
        const base64 = await new Promise<string>(res => {
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) onUpdate(editingId, formData);
    else onAdd(formData);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ unitNumber: '', floor: 0, rooms: 1, view: VIEWS[0], dailyPrice: 0, monthlyPrice: 0, maxDiscount: 0, images: [], ownerId: '' });
  };

  return (
    <div className="space-y-10 pb-32 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Units Inventory</h2>
          <p className="text-slate-500 font-bold mt-2">Manage the Bahia Hurghada physical asset database</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-slate-950 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-black transition-all shadow-2xl">
            <Plus className="w-7 h-7" /> Register New Asset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {apartments.map(apt => {
          const owner = owners.find(o => o.id === apt.ownerId);
          return (
            <div key={apt.id} className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl hover:shadow-2xl transition-all group flex flex-col">
              <div className="relative h-64 bg-slate-50 overflow-hidden">
                {apt.images[0] ? (
                  <img src={apt.images[0]} alt="Room" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><Home className="w-20 h-20 opacity-10" /></div>
                )}
                <div className="absolute top-6 left-6 bg-slate-950 text-white px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center">
                  <span className="text-[10px] opacity-40 font-black uppercase tracking-widest mb-1">Room</span>
                  <span className="text-3xl font-black tracking-tighter">{apt.unitNumber}</span>
                </div>
                {owner && (
                  <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-slate-900 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-white">
                    <Briefcase className="w-3 h-3 text-sky-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{owner.name}</span>
                  </div>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-4">
                  <h4 className="font-black text-slate-900 text-2xl tracking-tight">Floor {apt.floor} • {apt.rooms} Beds</h4>
                  <p className="text-sky-600 font-black text-xs uppercase tracking-widest mt-2 flex items-center gap-2"><Eye className="w-4 h-4" /> {apt.view}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-50 pt-6">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Standard Rate</p>
                    <p className="text-xl font-black text-slate-900">{apt.dailyPrice.toLocaleString()} <span className="text-[10px] opacity-40">EGP</span></p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <p className="text-[9px] text-emerald-600 font-black uppercase mb-1">Monthly Peak</p>
                    <p className="text-xl font-black text-emerald-950">{apt.monthlyPrice.toLocaleString()} <span className="text-[10px] opacity-40">EGP</span></p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end items-center gap-3">
                  {isAdmin && (
                    <>
                      <button onClick={() => { setEditingId(apt.id); setFormData(apt as any); setIsModalOpen(true); }} className="p-3 bg-white text-slate-400 hover:text-sky-600 rounded-xl transition-all border border-slate-100"><Edit2 className="w-5 h-5" /></button>
                      <button onClick={() => onDelete(apt.id)} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-100"><Trash2 className="w-5 h-5" /></button>
                    </>
                  )}
                  <button onClick={() => window.open(`https://wa.me/?text=Bahia Hurghada: Unit ${apt.unitNumber} available at ${apt.dailyPrice} EGP/Night`, '_blank')} className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100"><MessageCircle className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 max-h-[95vh] flex flex-col border-4 border-slate-900 overflow-hidden">
            <div className="p-10 shrink-0 flex justify-between items-center bg-slate-50 border-b border-slate-100">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-950 rounded-xl text-white"><Building className="w-6 h-6" /></div>
                  <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">{editingId ? 'Edit Folio' : 'Asset Registration'}</h3>
               </div>
               <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-950"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Unit Number</label>
                  <input required placeholder="e.g. 204" value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-950 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Floor Level</label>
                  <input required type="number" value={formData.floor || ''} onChange={e => setFormData({...formData, floor: Number(e.target.value)})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-950 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Portfolio Owner</label>
                  <select className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-950 outline-none bg-white" value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})}>
                    <option value="">Admin / Bahia Owned</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Bed Inventory</label>
                  <input required type="number" value={formData.rooms || ''} onChange={e => setFormData({...formData, rooms: Number(e.target.value)})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-950 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Landscape View</label>
                  <select value={formData.view} onChange={e => setFormData({...formData, view: e.target.value})} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-black focus:border-slate-950 outline-none bg-white">
                    {VIEWS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nightly Price (EGP)</label>
                  <input required type="number" value={formData.dailyPrice || ''} onChange={e => handleDailyPriceChange(Number(e.target.value))} className="w-full p-5 rounded-2xl border-2 border-slate-950 font-black text-2xl text-slate-950 outline-none" />
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Asset Imagery</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" id="apt-photos-input" disabled={isProcessing} />
                <label htmlFor="apt-photos-input" className={`w-full flex flex-col items-center justify-center gap-4 p-12 rounded-[3rem] border-4 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all ${isProcessing ? 'opacity-50' : ''}`}>
                  {isProcessing ? <Loader2 className="w-12 h-12 animate-spin text-sky-500" /> : <Plus className="w-12 h-12 text-slate-300" />}
                  <p className="font-black text-slate-400 text-xs uppercase tracking-widest">Select files for upload</p>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group border-2 border-white shadow-sm">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(p => ({...p, images: p.images.filter((_, i) => i !== idx)}))} className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button type="submit" disabled={isProcessing} className="w-full py-10 bg-slate-950 text-white font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl hover:bg-emerald-600 transition-all border-b-8 border-slate-900">
                {editingId ? 'Modify Asset Profile' : 'Commit Asset to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apartments;
