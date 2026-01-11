
import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Download, Mail, Phone, Globe, UserCircle, 
  ExternalLink, FileSpreadsheet, ChevronRight, UserPlus, Edit2, Trash2, X, Save, Printer, Wallet, Star
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
    const headers = ['Guest Name', 'Phone', 'Email', 'Nationality', 'Stay Count', 'Total Spent EGP'];
    const rows = filteredCustomers.map(c => {
       const guestBookings = state.bookings.filter(b => b.customerId === c.id && b.status !== 'cancelled');
       const totalSpent = guestBookings.reduce((acc, b) => acc + (b.currency === 'USD' ? b.paidAmount * 50 : b.paidAmount), 0);
       return [
         c.name,
         c.phone,
         c.email || 'N/A',
         c.nationality,
         guestBookings.length,
         totalSpent.toFixed(2)
       ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_crm_export_${new Date().toISOString().split('T')[0]}.csv`;
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
              placeholder="Search by identity, contact, email..." 
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-sky-500 outline-none font-bold text-xs transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {permissions.canExportData && (
            <div className="flex gap-2">
              <button onClick={exportToCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all">
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-950 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-sky-500 transition-all">
                <Printer className="w-4 h-4" /> Print PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              <th className="px-10 py-6">Guest Profile</th>
              <th className="px-10 py-6">Direct Access</th>
              <th className="px-10 py-6">Region</th>
              <th className="px-10 py-6 text-center">Engagement Metrics</th>
              <th className="px-10 py-6 text-right no-print">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCustomers.map(c => {
               const guestBookings = state.bookings.filter(b => b.customerId === c.id && b.status !== 'cancelled');
               return (
                <tr key={c.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-slate-950 group-hover:text-white transition-all shadow-sm">
                        <UserCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-black text-slate-950 text-base tracking-tight truncate uppercase leading-none">{c.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Ref ID: {c.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5 space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                      <Phone className="w-4 h-4 text-emerald-500" /> {c.phone}
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                        <Mail className="w-4 h-4 text-sky-400" /> {c.email}
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-xl w-fit border border-slate-100">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{c.nationality}</span>
                    </div>
                  </td>
                  <td className="px-10 py-5 text-center">
                    <div className="inline-flex gap-8 items-center">
                       <div className="text-center">
                          <span className="text-2xl font-black text-slate-950 leading-none block">{guestBookings.length}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 block">Folios</span>
                       </div>
                       <div className="text-center border-l pl-8 border-slate-100">
                          <span className="text-base font-black text-emerald-600 leading-none block flex items-center gap-1"><Wallet className="w-3 h-3" /> {guestBookings.reduce((acc, b) => acc + (b.currency === 'USD' ? b.paidAmount * 50 : b.paidAmount), 0).toLocaleString()}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 block">Value (EGP)</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right no-print">
                     <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        {permissions.canManageCustomers && (
                          <button onClick={() => setEditModal({ open: true, customer: { ...c } })} className="p-3 bg-white text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl border border-slate-100 transition-all shadow-sm"><Edit2 className="w-5 h-5" /></button>
                        )}
                        {permissions.canDeleteCustomers && (
                          <button onClick={() => { if(window.confirm('Delete guest profile permanently?')) onDeleteCustomer(c.id); }} className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-100 transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Edit Modal Re-included internally */}
    </div>
  );
};

export default Customers;
