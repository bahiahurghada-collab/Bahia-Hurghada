
import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Download, Mail, Phone, Globe, UserCircle, 
  ExternalLink, FileSpreadsheet, ChevronRight, UserPlus, Edit2, Trash2, X, Save, Printer, Wallet, Star
} from 'lucide-react';
import { AppState, Customer, UserPermissions } from '../types';

interface CustomersProps {
  state: AppState;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  permissions: UserPermissions;
}

const Customers: React.FC<CustomersProps> = ({ state, onUpdateCustomer, onDeleteCustomer, permissions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState<{ open: boolean, customer: Customer | null }>({ open: false, customer: null });

  const filteredCustomers = useMemo(() => {
    return state.customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.customers, searchQuery]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModal.customer) {
      onUpdateCustomer(editModal.customer.id, editModal.customer);
      setEditModal({ open: false, customer: null });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-bold">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
             <Users className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Guest CRM Database</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> {state.customers.length} VERIFIED PROFILES
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search guests..." 
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-sky-500 outline-none font-bold text-xs transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => window.print()} className="bg-slate-950 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-sky-500 transition-all">
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              <th className="px-10 py-6">Guest Profile</th>
              <th className="px-10 py-6">Contact</th>
              <th className="px-10 py-6">Nationality</th>
              <th className="px-10 py-6 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCustomers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-10 py-5">
                  <div className="flex items-center gap-5">
                    <UserCircle className="w-10 h-10 text-slate-400" />
                    <p className="font-black text-slate-950 text-base uppercase">{c.name}</p>
                  </div>
                </td>
                <td className="px-10 py-5 text-xs text-slate-900">
                  <p>{c.phone}</p>
                  <p className="text-[10px] text-slate-400">{c.email}</p>
                </td>
                <td className="px-10 py-5 uppercase text-xs text-slate-500 font-black">{c.nationality}</td>
                <td className="px-10 py-5 text-right no-print">
                   <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditModal({ open: true, customer: { ...c } })} className="p-3 bg-white text-slate-400 hover:text-sky-600 rounded-xl border border-slate-100 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if(window.confirm('Delete guest?')) onDeleteCustomer(c.id); }} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl border border-slate-100 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModal.open && editModal.customer && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full border-2 border-slate-900 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Edit Guest Identity</h3>
                <button onClick={() => setEditModal({ open: false, customer: null })}><X className="w-8 h-8 text-slate-950" /></button>
             </div>
             <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                   <input required className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black" value={editModal.customer.name} onChange={e => setEditModal({ ...editModal, customer: { ...editModal.customer!, name: e.target.value } })} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Contact</label>
                   <input required className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black" value={editModal.customer.phone} onChange={e => setEditModal({ ...editModal, customer: { ...editModal.customer!, phone: e.target.value } })} />
                </div>
                <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-sky-600 transition-all">Save Profile Changes</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
