
import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Download, Mail, Phone, Globe, UserCircle, 
  ExternalLink, FileSpreadsheet, ChevronRight, UserPlus, Edit2, Trash2, X, Save
} from 'lucide-react';
import { AppState, Customer, UserPermissions } from '../types';
import { NATIONALITIES } from '../constants';

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

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Nationality', 'Total Bookings'];
    const rows = filteredCustomers.map(c => [
      c.name, c.phone, c.email || 'N/A', c.nationality,
      state.bookings.filter(b => b.customerId === c.id).length
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_guests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModal.customer) {
      onUpdateCustomer(editModal.customer.id, editModal.customer);
      setEditModal({ open: false, customer: null });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-2xl text-white shadow-lg shadow-slate-200"><Users className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-950 tracking-tighter uppercase leading-none">Guest CRM Database</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Managed Verified Profiles: {state.customers.length}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Filter guest records..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:border-sky-500 outline-none font-bold text-[11px] transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {permissions.canExportData && (
            <button onClick={exportToCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-widest">
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <th className="px-8 py-5">Guest Identity</th>
              <th className="px-8 py-5">Contact Access</th>
              <th className="px-8 py-5">Nationality</th>
              <th className="px-8 py-5 text-center">Stays</th>
              <th className="px-8 py-5 text-right">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCustomers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-sky-500 group-hover:text-white transition-all">
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-[13px] tracking-tight truncate uppercase">{c.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">UID: {c.id.substring(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4 space-y-1">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px]">
                    <Phone className="w-3 h-3 text-emerald-500" /> {c.phone}
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2 text-slate-400 font-medium text-[10px]">
                      <Mail className="w-3 h-3 text-sky-400" /> {c.email}
                    </div>
                  )}
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg w-fit">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{c.nationality}</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-base font-black text-slate-900 leading-none">{state.bookings.filter(b => b.customerId === c.id).length}</span>
                    <span className="text-[7px] font-black text-slate-400 uppercase mt-1">Confirmed</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                   <div className="flex justify-end gap-2">
                      {permissions.canManageCustomers && (
                        <button onClick={() => setEditModal({ open: true, customer: { ...c } })} className="p-2 bg-slate-100 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                      )}
                      {permissions.canDeleteCustomers && (
                        <button onClick={() => { if(window.confirm('Erase this guest profile?')) onDeleteCustomer(c.id); }} className="p-2 bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      )}
                      <button className="p-2 bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><ExternalLink className="w-4 h-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Customer Modal */}
      {editModal.open && editModal.customer && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 border-2 border-slate-950">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Modify Guest Profile</h3>
                <button onClick={() => setEditModal({ open: false, customer: null })} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-8 h-8" /></button>
             </div>
             
             <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                   <input required className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none" value={editModal.customer.name} onChange={e => setEditModal({...editModal, customer: {...editModal.customer!, name: e.target.value}})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone</label>
                      <input required className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none" value={editModal.customer.phone} onChange={e => setEditModal({...editModal, customer: {...editModal.customer!, phone: e.target.value}})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nationality</label>
                      <select className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none" value={editModal.customer.nationality} onChange={e => setEditModal({...editModal, customer: {...editModal.customer!, nationality: e.target.value}})}>
                         {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                   <input className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-900 outline-none" value={editModal.customer.email || ''} onChange={e => setEditModal({...editModal, customer: {...editModal.customer!, email: e.target.value}})} />
                </div>
                <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl mt-4 flex items-center justify-center gap-3">
                   <Save className="w-5 h-5" /> Commit Changes
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
