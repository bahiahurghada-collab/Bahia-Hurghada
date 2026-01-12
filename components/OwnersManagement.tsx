
import React, { useState } from 'react';
import { Plus, Briefcase, UserCircle, Phone, Mail, FileText, Trash2, Edit2, X, Save, TrendingUp, Wallet } from 'lucide-react';
import { Owner, AppState } from '../types';

interface OwnersManagementProps {
  owners: Owner[];
  apartments: any[];
  onAdd: (owner: Omit<Owner, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Owner>) => void;
  onDelete: (id: string) => void;
}

const OwnersManagement: React.FC<OwnersManagementProps> = ({ owners, apartments, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Owner, 'id'>>({
    name: '',
    phone: '',
    email: '',
    bankAccount: '',
    contractType: 'Percentage',
    contractValue: 20
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) onUpdate(editingId, formData);
    else onAdd(formData);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', bankAccount: '', contractType: 'Percentage', contractValue: 20 });
  };

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Portfolio Owners</h2>
          <p className="text-slate-500 font-bold mt-2">Manage unit owners and revenue sharing contracts</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-slate-950 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-sky-600 transition-all shadow-2xl">
          <Plus className="w-6 h-6" /> Add New Owner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {owners.map(owner => {
          const ownedUnits = apartments.filter(a => a.ownerId === owner.id);
          return (
            <div key={owner.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-lg hover:shadow-2xl transition-all group flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                    <UserCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase">{owner.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Partner
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(owner.id); setFormData(owner); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if(window.confirm('Delete Owner?')) onDelete(owner.id); }} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <Phone className="w-4 h-4 text-sky-500" /> {owner.phone}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-sky-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-sky-600 uppercase mb-1">Owned Assets</p>
                    <p className="text-2xl font-black text-sky-950">{ownedUnits.length} <span className="text-[10px] opacity-40">Units</span></p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Contract</p>
                    <p className="text-lg font-black text-emerald-950">
                      {owner.contractType === 'Percentage' ? `${owner.contractValue}% Share` : `${owner.contractValue} EGP`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex -space-x-3">
                    {ownedUnits.map(u => (
                       <div key={u.id} className="w-10 h-10 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-sm" title={`Unit ${u.unitNumber}`}>
                          {u.unitNumber}
                       </div>
                    ))}
                    {ownedUnits.length === 0 && <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No assigned units</span>}
                 </div>
                 <button className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline">View Portfolio Details</button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full border-4 border-slate-900 animate-in zoom-in-95 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-slate-900 text-white rounded-2xl"><Briefcase className="w-8 h-8" /></div>
                 <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">{editingId ? 'Modify Partner' : 'New Portfolio Partner'}</h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-10 h-10 text-slate-950" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Legal Full Name</label>
                  <input required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:border-slate-950 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Primary Contact</label>
                  <input required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:border-slate-950 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Contract Structure</label>
                  <select className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:border-slate-950 outline-none" value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value as any})}>
                    <option value="Percentage">Revenue Percentage (%)</option>
                    <option value="Fixed">Fixed Monthly Fee (EGP)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Contract Value</label>
                  <input type="number" required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:border-slate-950 outline-none text-2xl text-sky-600" value={formData.contractValue || ''} onChange={e => setFormData({...formData, contractValue: Number(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Bank Settlement Details</label>
                <textarea className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black focus:border-slate-950 outline-none min-h-[100px]" placeholder="Account Number, IBAN, or Payment Method..." value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} />
              </div>

              <button type="submit" className="w-full py-8 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all border-b-8 border-slate-900 mt-6">
                Commit Partner Policy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnersManagement;
