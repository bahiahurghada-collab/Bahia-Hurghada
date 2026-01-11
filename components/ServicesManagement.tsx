
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Zap, Save, X, Search, CheckCircle2, History, BellRing } from 'lucide-react';
import { AppState, ExtraService, StayService, Booking } from '../types';

interface ServicesManagementProps {
  state: AppState;
  onAdd: (service: Omit<ExtraService, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ExtraService>) => void;
  onDelete: (id: string) => void;
  onFulfillService?: (bookingId: string, serviceId: string, isExtra: boolean) => void;
  onDeleteHistoryItem?: (bookingId: string, recordId: string, isExtra: boolean) => void;
  onEditBooking?: (id: string, updates: Partial<Booking>) => void;
}

const ServicesManagement: React.FC<ServicesManagementProps> = ({ 
  state, onAdd, onUpdate, onDelete, onFulfillService, onDeleteHistoryItem, onEditBooking 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, isFree: false });
  const [historySearch, setHistorySearch] = useState('');

  // تعديل سجل تاريخ (للخدمات الإضافية فقط لأن السعر مخزن فيها)
  const [editRecord, setEditRecord] = useState<{bookingId: string, record: StayService} | null>(null);

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
      if (b.status === 'confirmed' || b.status === 'stay' || b.status === 'pending') {
        const apt = state.apartments.find(a => a.id === b.apartmentId)?.unitNumber || '?';
        const guest = state.customers.find(c => c.id === b.customerId)?.name || 'Guest';
        
        b.services.forEach(sid => {
          if (!(b.fulfilledServices || []).includes(sid)) {
            const sTemplate = state.services.find(s => s.id === sid);
            if (sTemplate) {
              orders.push({
                id: `p-${b.id}-${sid}`,
                bookingId: b.id,
                displayId: b.displayId,
                serviceId: sid,
                name: sTemplate.name,
                apt,
                guest,
                date: b.startDate,
                isExtra: false
              });
            }
          }
        });

        (b.extraServices || []).forEach(es => {
          if (!es.isFulfilled) {
            orders.push({
              id: `e-${b.id}-${es.id}`,
              bookingId: b.id,
              displayId: b.displayId,
              serviceId: es.id,
              name: es.name,
              apt,
              guest,
              date: es.date,
              isExtra: true
            });
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
            history.push({
              id: `hist-${b.id}-${sid}`,
              bookingId: b.id,
              recordId: sid,
              displayId: b.displayId,
              name: sTemplate.name,
              price: sTemplate.price,
              date: b.startDate,
              isPaid: b.paymentStatus === 'Paid',
              apt: apt?.unitNumber || '?',
              guest: guest?.name || 'Guest',
              isExtra: false
            });
          }
        }
      });

      (b.extraServices || []).forEach(s => {
        if (s.isFulfilled) {
          history.push({
            id: s.id,
            bookingId: b.id,
            recordId: s.id,
            displayId: b.displayId,
            name: s.name,
            price: s.price,
            date: s.date,
            isPaid: s.isPaid,
            apt: apt?.unitNumber || '?',
            guest: guest?.name || 'Guest',
            isExtra: true,
            fullRecord: s
          });
        }
      });
    });
    return history.sort((a, b) => b.date.localeCompare(a.date));
  }, [state.bookings, state.services, state.apartments, state.customers]);

  const filteredHistory = useMemo(() => {
    return serviceHistory.filter(h => 
      h.apt.includes(historySearch) || 
      h.name.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.guest.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.displayId.toLowerCase().includes(historySearch.toLowerCase())
    );
  }, [serviceHistory, historySearch]);

  const handleEditRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord || !onEditBooking) return;
    
    const booking = state.bookings.find(b => b.id === editRecord.bookingId);
    if (!booking) return;

    const updatedExtra = booking.extraServices.map(es => 
      es.id === editRecord.record.id ? editRecord.record : es
    );

    // إعادة حساب الإجمالي
    const oldPrice = booking.extraServices.find(es => es.id === editRecord.record.id)?.price || 0;
    const priceDiff = editRecord.record.price - oldPrice;

    onEditBooking(booking.id, {
      extraServices: updatedExtra,
      totalAmount: booking.totalAmount + priceDiff,
      paidAmount: editRecord.record.isPaid ? booking.paidAmount + priceDiff : booking.paidAmount
    });

    setEditRecord(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-950 rounded-2xl text-white"><Zap className="w-7 h-7" /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Amenities Ops</h2>
            <p className="text-slate-400 font-bold mt-2 text-[10px] uppercase tracking-widest">Fulfillment & Archiving Hub V15.3</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-sky-500 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-[12px] tracking-widest shadow-lg">
          <Plus className="w-5 h-5" /> New Service Asset
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-[3rem] p-8">
         <div className="flex items-center gap-3 mb-6">
            <BellRing className="w-5 h-5 text-amber-600" />
            <h3 className="text-xl font-black uppercase text-amber-900 tracking-tighter">Pending Delivery Queue</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map(o => (
               <div key={o.id} className="bg-white p-5 rounded-3xl border border-amber-100 flex items-center justify-between group shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-black text-xs border border-amber-200">U-{o.apt}</div>
                     <div>
                        <p className="text-[12px] font-black text-slate-950 uppercase leading-none">{o.name}</p>
                        <p className="text-[8px] font-bold text-sky-600 uppercase mt-1">ID: {o.displayId} • {o.guest}</p>
                     </div>
                  </div>
                  <button onClick={() => onFulfillService?.(o.bookingId, o.serviceId, o.isExtra)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                     <CheckCircle2 className="w-4 h-4" />
                  </button>
               </div>
            ))}
            {pendingOrders.length === 0 && <div className="col-span-3 py-10 text-center opacity-30 font-black text-[10px] uppercase">All clear: No pending services</div>}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-sky-50 rounded-xl text-sky-600"><Zap className="w-5 h-5" /></div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(s.id); setFormData({ ...s }); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if(window.confirm('Delete this asset?')) onDelete(s.id); }} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-950 uppercase mb-1">{s.name}</h3>
            <p className="text-xl font-black text-slate-900 mt-4 border-t pt-4">{s.price.toLocaleString()} EGP</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
            <div className="flex items-center gap-4">
               <History className="w-6 h-6 text-slate-950" />
               <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Delivered Service Archive</h3>
            </div>
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input placeholder="Search Archive..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-[10px]" value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left font-bold border-collapse">
               <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[8px] uppercase tracking-widest border-b">
                     <th className="px-8 py-5">Date</th>
                     <th className="px-8 py-5">Service Asset</th>
                     <th className="px-8 py-5">Unit / Booking ID</th>
                     <th className="px-8 py-5">Guest</th>
                     <th className="px-8 py-5 text-right">Pricing</th>
                     <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map(h => (
                     <tr key={h.id} className="hover:bg-slate-50 transition-all text-[11px]">
                        <td className="px-8 py-5 text-slate-400">{h.date}</td>
                        <td className="px-8 py-5 uppercase font-black">{h.name}</td>
                        <td className="px-8 py-5">
                           <p className="font-black text-slate-600">Unit {h.apt}</p>
                           <p className="text-[9px] text-sky-500 uppercase">{h.displayId}</p>
                        </td>
                        <td className="px-8 py-5 uppercase font-bold text-slate-500">{h.guest}</td>
                        <td className="px-8 py-5 text-right">
                           <p className="text-lg font-black text-slate-950">{h.price.toLocaleString()} EGP</p>
                           <span className={`text-[8px] font-black uppercase ${h.isPaid ? 'text-emerald-500' : 'text-rose-500'}`}>{h.isPaid ? 'Settled' : 'Unpaid'}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex justify-end gap-2">
                              {h.isExtra && (
                                <button onClick={() => setEditRecord({bookingId: h.bookingId, record: h.fullRecord})} className="p-2 bg-slate-100 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                              )}
                              <button onClick={() => { if(window.confirm('Delete this record from history?')) onDeleteHistoryItem?.(h.bookingId, h.recordId, h.isExtra); }} className="p-2 bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* مودال تعديل سجل من الأرشيف */}
      {editRecord && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full border-2 border-slate-950 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">Modify Archive Record</h3>
                 <button onClick={() => setEditRecord(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-8 h-8" /></button>
              </div>
              <form onSubmit={handleEditRecordSubmit} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Service Name</label>
                    <input disabled className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-100 font-black opacity-50" value={editRecord.record.name} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Record Date</label>
                    <input type="date" className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-sky-500" value={editRecord.record.date} onChange={e => setEditRecord({...editRecord, record: {...editRecord.record, date: e.target.value}})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Final Price (EGP)</label>
                    <input type="number" className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-sky-600 outline-none focus:border-sky-500" value={editRecord.record.price} onChange={e => setEditRecord({...editRecord, record: {...editRecord.record, price: Number(e.target.value)}})} />
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <input type="checkbox" id="isPaid" checked={editRecord.record.isPaid} onChange={e => setEditRecord({...editRecord, record: {...editRecord.record, isPaid: e.target.checked}})} className="w-5 h-5 accent-emerald-600" />
                    <label htmlFor="isPaid" className="text-xs font-black text-emerald-800 uppercase cursor-pointer">Mark as Settled / Paid</label>
                 </div>
                 <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl">
                    Update Ledger Entry
                 </button>
              </form>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full border-2 border-slate-950 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">{editingId ? 'Modify Asset' : 'New Service Asset'}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-8 h-8" /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Service Name</label>
                   <input required className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-sky-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Price (EGP)</label>
                   <input required type="number" className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-sky-500" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-4">
                   <Save className="w-5 h-5 inline mr-2" /> {editingId ? 'Commit Changes' : 'Publish Asset'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
