
import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Download, Mail, Phone, Globe, UserCircle, 
  ExternalLink, FileSpreadsheet, ChevronRight, UserPlus
} from 'lucide-react';
import { AppState, Customer } from '../types';

interface CustomersProps {
  state: AppState;
}

const Customers: React.FC<CustomersProps> = ({ state }) => {
  const [searchQuery, setSearchQuery] = useState('');

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
      c.name,
      c.phone,
      c.email || 'N/A',
      c.nationality,
      state.bookings.filter(b => b.customerId === c.id).length
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bahia_guests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-2xl text-white shadow-lg shadow-slate-200"><Users className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-950 tracking-tighter uppercase leading-none">Guest Database</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Total Verified Guests: {state.customers.length}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search by name, phone or email..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:border-sky-500 outline-none font-bold text-[11px] transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={exportToCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-widest">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <th className="px-8 py-5">Guest Profile</th>
              <th className="px-8 py-5">Contact Details</th>
              <th className="px-8 py-5">Nationality</th>
              <th className="px-8 py-5 text-center">Bookings</th>
              <th className="px-8 py-5 text-right">Actions</th>
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
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">GUEST-ID: {c.id.substring(0, 6)}</p>
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
                    <span className="text-[7px] font-black text-slate-400 uppercase mt-1">Stays</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                  <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all border border-transparent hover:border-sky-100">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center opacity-20">
                    <Users className="w-16 h-16 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No matching guests found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
