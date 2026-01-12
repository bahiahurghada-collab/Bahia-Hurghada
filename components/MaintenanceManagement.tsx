
import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit2, Hammer, X, Banknote, ShoppingCart, Tag, Calendar, Building
} from 'lucide-react';
import { Expense, Currency, Apartment } from '../types';
import { CURRENCIES } from '../constants';

interface MaintenanceManagementProps {
  expenses: Expense[];
  apartments: Apartment[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({ expenses, apartments, onAddExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    category: 'maintenance',
    description: '',
    amount: 0,
    currency: 'EGP',
    apartmentId: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense(formData);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'maintenance',
      description: '',
      amount: 0,
      currency: 'EGP',
      apartmentId: ''
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Operations Ledger</h2>
          <p className="text-slate-500 font-bold mt-2">Log unit repairs, supplies, and operational expenses</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-rose-600 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-rose-700 transition-all">
          <Plus className="w-7 h-7" /> Log Outflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {expenses.length > 0 ? expenses.map(e => {
          const apt = apartments.find(a => a.id === e.apartmentId);
          return (
            <div key={e.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between group hover:border-rose-200 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{e.category}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{e.date}</span>
                    <span className="text-slate-300">•</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${apt ? 'text-sky-600' : 'text-slate-400'}`}>
                      {apt ? `UNIT ${apt.unitNumber}` : 'GENERAL'}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-800">{e.description}</h4>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                  <p className="text-2xl font-black text-rose-600">-{e.amount.toLocaleString()} <span className="text-xs font-bold">{e.currency}</span></p>
                </div>
                <button onClick={() => onDeleteExpense(e.id)} className="p-4 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          )
        }) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 font-black text-slate-300 uppercase tracking-widest">Zero Outflows Logged</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg"><ShoppingCart className="w-8 h-8" /></div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Log Expense</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-800"><X className="w-10 h-10 text-slate-800" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Category</label>
                     <select className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                        <option value="maintenance">Maintenance</option>
                        <option value="supplies">Supplies</option>
                        <option value="utility">Utility</option>
                        <option value="other">Other</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Link to Unit</label>
                     <select className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none" value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})}>
                        <option value="">General (No Unit)</option>
                        {apartments.map(a => <option key={a.id} value={a.id}>Unit {a.unitNumber}</option>)}
                     </select>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Description</label>
                  <input required className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:border-slate-400" placeholder="What was purchased?" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Date</label>
                    <input type="date" required className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Amount</label>
                    <input type="number" required className="w-full p-4 rounded-xl border border-slate-200 bg-white font-black text-xl text-rose-600 outline-none" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Currency</label>
                    <select className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-6 bg-[#1e293b] text-slate-100 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-sky-600 transition-all">
                Add to Ledger
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;
