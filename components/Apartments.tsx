
import React, { useState } from 'react';
import { Plus, Home, Eye, MessageCircle, X, Trash2, Loader2, Edit2, Building, Info } from 'lucide-react';
import { Apartment, UserRole } from '../types';
import { VIEWS } from '../constants';

interface ApartmentsProps {
  apartments: Apartment[];
  userRole: UserRole;
  onAdd: (apt: Omit<Apartment, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Apartment>) => void;
  onDelete: (id: string) => void;
}

const Apartments: React.FC<ApartmentsProps> = ({ apartments, userRole, onAdd, onUpdate, onDelete }) => {
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
    images: [] as string[]
  });

  const handleDailyPriceChange = (val: number) => {
    // التعديل: حساب السعر الشهري تلقائياً (مثلاً 30 يوم مع خصم 10% افتراضي للجملة)
    const suggestedMonthly = Math.round(val * 30 * 0.9);
    setFormData(prev => ({ 
      ...prev, 
      dailyPrice: val, 
      monthlyPrice: suggestedMonthly 
    }));
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsProcessing(true);
      const newImages: string[] = [];
      for (const file of Array.from(files) as File[]) {
        const reader = new FileReader();
        const base64 = await new Promise<string>(res => {
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
        const compressed = await compressImage(base64);
        newImages.push(compressed);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
      setIsProcessing(false);
    }
  };

  const startEdit = (apt: Apartment) => {
    setEditingId(apt.id);
    setFormData({ ...apt });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (editingId) onUpdate(editingId, formData);
    else onAdd(formData);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ unitNumber: '', floor: 0, rooms: 1, view: VIEWS[0], dailyPrice: 0, monthlyPrice: 0, maxDiscount: 0, images: [] });
  };

  return (
    <div className="space-y-10 pb-32 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">Units List</h2>
          <p className="text-slate-500 font-bold mt-2">Manage the Bahia Hurghada room inventory</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-black transition-all shadow-2xl">
            <Plus className="w-7 h-7" /> Add Room
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {apartments.map(apt => (
          <div key={apt.id} className="bg-white rounded-[3rem] overflow-hidden border-2 border-slate-100 shadow-xl hover:shadow-2xl transition-all group flex flex-col">
            <div className="relative h-64 bg-slate-50 overflow-hidden">
              {apt.images[0] ? (
                <img src={apt.images[0]} alt="Room" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200"><Home className="w-20 h-20 opacity-10" /></div>
              )}
              <div className="absolute top-6 left-6 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center">
                <span className="text-[10px] opacity-40 font-black uppercase tracking-widest mb-1">Room</span>
                <span className="text-3xl font-black tracking-tighter">{apt.unitNumber}</span>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="mb-4">
                <h4 className="font-black text-slate-900 text-2xl tracking-tight">Floor {apt.floor} • {apt.rooms} Beds</h4>
                <p className="text-sky-600 font-black text-xs uppercase tracking-widest mt-2 flex items-center gap-2"><Eye className="w-4 h-4" /> {apt.view}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-50 pt-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Nightly</p>
                  <p className="text-xl font-black text-slate-900">{apt.dailyPrice.toLocaleString()} <span className="text-[10px] opacity-40">EGP</span></p>
                </div>
                <div className="bg-sky-50 p-4 rounded-2xl">
                  <p className="text-[9px] text-sky-600 font-black uppercase mb-1">Monthly (Disc.)</p>
                  <p className="text-xl font-black text-sky-950">{(apt.monthlyPrice || 0).toLocaleString()} <span className="text-[10px] opacity-40">EGP</span></p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end items-center gap-3">
                {isAdmin && (
                  <>
                    <button onClick={() => startEdit(apt)} className="p-3 bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl transition-all border-2 border-slate-100"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => onDelete(apt.id)} className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all border-2 border-rose-100"><Trash2 className="w-5 h-5" /></button>
                  </>
                )}
                <button onClick={() => window.open(`https://wa.me/?text=Room ${apt.unitNumber}: ${apt.dailyPrice} EGP/Night`, '_blank')} className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border-2 border-emerald-100"><MessageCircle className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 max-h-[95vh] flex flex-col border-4 border-slate-900 overflow-hidden">
            <div className="p-10 shrink-0 flex justify-between items-center bg-slate-50 border-b border-slate-100">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-xl text-white"><Building className="w-6 h-6" /></div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editingId ? 'Edit Room' : 'Add New Room'}</h3>
               </div>
               <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-8 h-8 text-slate-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Room Number</label>
                  <input required placeholder="e.g. 101" value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-bold text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Floor</label>
                  <input required type="number" value={formData.floor || ''} onChange={e => setFormData({...formData, floor: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-bold text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Beds</label>
                  <input required type="number" value={formData.rooms || ''} onChange={e => setFormData({...formData, rooms: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-bold text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">View</label>
                  <select value={formData.view} onChange={e => setFormData({...formData, view: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-white font-bold text-slate-900">
                    {VIEWS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Price / Night</label>
                  <input required type="number" value={formData.dailyPrice || ''} onChange={e => handleDailyPriceChange(Number(e.target.value))} className="w-full p-4 rounded-xl border-2 border-slate-900 bg-white font-black text-xl text-slate-950" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Price / Month</label>
                    {/* Fix: Wrapped Info icon in span to handle 'title' attribute since Lucide icons don't support it directly */}
                    <span title="Auto-calculated with 10% discount">
                      <Info className="w-3 h-3 text-sky-500" />
                    </span>
                  </div>
                  <input required type="number" value={formData.monthlyPrice || ''} onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-sky-600 bg-sky-50 font-black text-xl text-sky-950" />
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Room Photos</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" id="apt-photos-input" disabled={isProcessing} />
                <label htmlFor="apt-photos-input" className={`w-full flex flex-col items-center justify-center gap-4 p-10 rounded-[2rem] border-4 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isProcessing ? <Loader2 className="w-10 h-10 animate-spin text-sky-600" /> : <Plus className="w-10 h-10 text-slate-400" />}
                  <p className="font-black text-slate-500 text-sm uppercase tracking-widest">Click to upload images</p>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(p => ({...p, images: p.images.filter((_, i) => i !== idx)}))} className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button type="submit" disabled={isProcessing} className="w-full py-8 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all">
                {editingId ? 'Save Room Changes' : 'Add Room to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apartments;
