
import React, { useState } from 'react';
import { 
  UserPlus, ShieldCheck, Trash2, Edit2, X, LockKeyhole, ToggleLeft, ToggleRight, LayoutGrid, Home, ConciergeBell, Hammer, BadgePercent, FileBarChart, History, Zap, Download, Activity, Monitor
} from 'lucide-react';
import { User, UserRole, UserPermissions } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialPermissions: UserPermissions = {
    canViewDashboard: true,
    canViewTimeline: true,
    canViewUnits: true,
    canManageUnits: false,
    canViewBookings: true,
    canManageBookings: true,
    canDeleteBookings: false,
    canViewCustomers: true,
    canManageCustomers: true,
    canDeleteCustomers: false,
    canViewServices: true,
    canManageServices: false,
    canViewReports: false,
    canViewStaff: false,
    canManageStaff: false,
    canViewLogs: false,
    canManageCommissions: false,
    canViewMaintenance: true,
    canManageMaintenance: false,
    canExportData: false
  };

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'reception' as UserRole,
    permissions: { ...initialPermissions }
  });

  const togglePermission = (key: keyof UserPermissions) => {
    setFormData({
      ...formData,
      permissions: { ...formData.permissions, [key]: !formData.permissions[key] }
    });
  };

  const setAllPermissions = (val: boolean) => {
    const updated = { ...formData.permissions };
    Object.keys(updated).forEach((k) => {
      (updated as any)[k] = val;
    });
    setFormData({ ...formData, permissions: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) onUpdateUser(editingId, formData);
    else onAddUser({ ...formData, isActive: true });
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '', username: '', password: '', role: 'reception',
      permissions: { ...initialPermissions }
    });
  };

  const permissionGroups = [
    {
      title: 'Operations & Monitoring',
      icon: Monitor,
      perms: [
        { id: 'canViewDashboard', label: 'Dashboard Hub' },
        { id: 'canViewTimeline', label: 'Timeline / Calendar' },
        { id: 'canViewLogs', label: 'System Audit Logs' },
      ]
    },
    {
      title: 'Reservations & Guests',
      icon: ConciergeBell,
      perms: [
        { id: 'canViewBookings', label: 'View Folios' },
        { id: 'canManageBookings', label: 'Create/Edit Folios' },
        { id: 'canDeleteBookings', label: 'Cancel/Delete Bookings' },
        { id: 'canViewCustomers', label: 'Guest Database' },
        { id: 'canManageCustomers', label: 'Modify Guest CRM' },
        { id: 'canDeleteCustomers', label: 'Erase Guest Records' },
      ]
    },
    {
      title: 'Finance & Sales',
      icon: BadgePercent,
      perms: [
        { id: 'canViewReports', label: 'Accounting Reports' },
        { id: 'canManageCommissions', label: 'Sales Commissions' },
        { id: 'canExportData', label: 'CSV/Data Export' },
      ]
    },
    {
      title: 'Maintenance & Assets',
      icon: Hammer,
      perms: [
        { id: 'canViewMaintenance', label: 'View Maintenance' },
        { id: 'canManageMaintenance', label: 'Add/Remove Expenses' },
        { id: 'canViewUnits', label: 'Unit Inventory' },
        { id: 'canManageUnits', label: 'Modify Units' },
        { id: 'canViewServices', label: 'View Amenities' },
        { id: 'canManageServices', label: 'Price Amenities' },
      ]
    },
    {
      title: 'Administration',
      icon: ShieldCheck,
      perms: [
        { id: 'canViewStaff', label: 'View Team' },
        { id: 'canManageStaff', label: 'User Roles & Access' },
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Team Authority</h2>
          <p className="text-slate-500 font-bold mt-2">Manage staff permissions and system access levels</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-sky-600 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-sky-700 transition-all uppercase text-xs tracking-widest">
          <UserPlus className="w-6 h-6" /> Provision Account
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-widest">Operator Name</th>
              <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-widest">Access Key</th>
              <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-widest">Global Role</th>
              <th className="px-10 py-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Security Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-6 font-black text-xl text-slate-800 uppercase tracking-tight">{u.name}</td>
                <td className="px-10 py-6 font-bold text-slate-400">@{u.username}</td>
                <td className="px-10 py-6">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingId(u.id); setFormData({ ...u, password: '' }); setIsModalOpen(true); }} className="p-3 text-sky-600 hover:bg-sky-50 rounded-xl transition-all border border-sky-100"><Edit2 className="w-5 h-5" /></button>
                    {u.username !== 'admin' && (
                      <button onClick={() => { if(window.confirm('Erase staff record?')) onDeleteUser(u.id); }} className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"><Trash2 className="w-5 h-5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-5xl w-full shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-slate-300 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#1e293b] text-slate-100 rounded-2xl shadow-lg"><LockKeyhole className="w-8 h-8" /></div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Access Permissions Matrix</h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-10 h-10 text-slate-800" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Operator Name</label>
                  <input required className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-slate-400 outline-none" placeholder="Full Employee Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">System Login ID</label>
                  <input required className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-slate-400 outline-none" placeholder="Unique Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Security Key</label>
                  <input required={!editingId} type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-slate-400 outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Template Role</label>
                  <select className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value="reception">Receptionist (Standard)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-8 bg-white border border-slate-200 rounded-[2rem] p-8">
                <div className="flex justify-between items-center border-b pb-6">
                   <div>
                      <h4 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Permissions Granularity</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manually override specific feature access</p>
                   </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setAllPermissions(true)} className="px-4 py-2 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all">Grant Full Access</button>
                    <button type="button" onClick={() => setAllPermissions(false)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Revoke All</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {permissionGroups.map((group, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
                        <div className="p-2 bg-[#1e293b] text-slate-100 rounded-lg"><group.icon className="w-4 h-4" /></div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">{group.title}</span>
                      </div>
                      <div className="space-y-2">
                        {group.perms.map(perm => (
                          <div key={perm.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer group" onClick={() => togglePermission(perm.id as keyof UserPermissions)}>
                            <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{perm.label}</span>
                            <button type="button">
                              {formData.permissions[perm.id as keyof UserPermissions] ? (
                                <ToggleRight className="w-8 h-8 text-sky-600" />
                              ) : (
                                <ToggleLeft className="w-8 h-8 text-slate-300" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-8 bg-[#1e293b] text-slate-100 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-sky-600 transition-all border-b-8 border-slate-900">
                Commit Security Policy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
