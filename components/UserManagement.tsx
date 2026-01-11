
import React, { useState } from 'react';
import { 
  UserPlus, ShieldCheck, Trash2, Edit2, X, LockKeyhole, ToggleLeft, ToggleRight, LayoutGrid, Home, ConciergeBell
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
  
  // Fix: Added missing canManageCommissions property to match UserPermissions type
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
    if (editingId) {
      onUpdateUser(editingId, formData);
    } else {
      onAddUser({ ...formData, isActive: true });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'reception',
      permissions: { ...initialPermissions }
    });
  };

  // Fix: Included missing permissions in the groups to allow full control in UI
  const permissionGroups = [
    {
      title: 'Main Access',
      icon: LayoutGrid,
      perms: [
        { id: 'canViewDashboard', label: 'View Dashboard' },
        { id: 'canViewTimeline', label: 'View Timeline' },
        { id: 'canViewLogs', label: 'View System Logs' },
      ]
    },
    {
      title: 'Bookings & Guests',
      icon: ConciergeBell,
      perms: [
        { id: 'canViewBookings', label: 'View Bookings' },
        { id: 'canManageBookings', label: 'Manage Bookings' },
        { id: 'canDeleteBookings', label: 'Cancel/Delete' },
        { id: 'canViewCustomers', label: 'View Guests' },
        { id: 'canManageCustomers', label: 'Edit Guests' },
        { id: 'canDeleteCustomers', label: 'Delete Guests' },
        { id: 'canManageCommissions', label: 'Manage Commissions' },
      ]
    },
    {
      title: 'System Settings',
      icon: Home,
      perms: [
        { id: 'canViewUnits', label: 'View Rooms' },
        { id: 'canManageUnits', label: 'Manage Rooms' },
        { id: 'canViewServices', label: 'View Services' },
        { id: 'canManageServices', label: 'Manage Services' },
        { id: 'canViewReports', label: 'View Finance' },
        { id: 'canViewStaff', label: 'View Team' },
        { id: 'canManageStaff', label: 'Manage Team' },
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter">Team Management</h2>
          <p className="text-slate-500 font-bold mt-2">Control system access for Bahia Hurghada staff</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-sky-600 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-sky-700 transition-all">
          <UserPlus className="w-7 h-7" /> Add Team Member
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-10 py-8 text-xs font-black text-slate-500 uppercase tracking-widest">Name</th>
              <th className="px-10 py-8 text-xs font-black text-slate-500 uppercase tracking-widest">Username</th>
              <th className="px-10 py-8 text-xs font-black text-slate-500 uppercase tracking-widest">Role</th>
              <th className="px-10 py-8 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-6 font-black text-xl text-slate-900">{u.name}</td>
                <td className="px-10 py-6 font-bold text-slate-500">@{u.username}</td>
                <td className="px-10 py-6">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingId(u.id); setFormData({ ...u, password: '' }); setIsModalOpen(true); }} className="p-3 text-sky-600 hover:bg-sky-50 rounded-xl transition-all border-2 border-sky-50"><Edit2 className="w-5 h-5" /></button>
                    {u.username !== 'admin' && (
                      <button onClick={() => onDeleteUser(u.id)} className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border-2 border-rose-50"><Trash2 className="w-5 h-5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-slate-900 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-lg"><LockKeyhole className="w-8 h-8" /></div>
                <h3 className="text-3xl font-black text-slate-950 tracking-tighter">User Permissions</h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-10 h-10 text-slate-950" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Display Name</label>
                  <input required className="w-full p-4 rounded-xl border-2 border-white bg-white font-bold" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Login Username</label>
                  <input required className="w-full p-4 rounded-xl border-2 border-white bg-white font-bold" placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Password</label>
                  <input required={!editingId} type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border-2 border-white bg-white font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Account Role</label>
                  <select className="w-full p-4 rounded-xl border-2 border-white bg-white font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value="reception">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-8 bg-white border-2 border-slate-100 rounded-[2rem] p-8">
                <div className="flex justify-between items-center border-b pb-4">
                  <h4 className="text-xl font-black text-slate-900">Permissions Matrix</h4>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setAllPermissions(true)} className="text-[10px] font-black uppercase text-sky-600 underline">Allow All</button>
                    <button type="button" onClick={() => setAllPermissions(false)} className="text-[10px] font-black uppercase text-rose-600 underline">Deny All</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {permissionGroups.map((group, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <group.icon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{group.title}</span>
                      </div>
                      <div className="space-y-3">
                        {group.perms.map(perm => (
                          <div key={perm.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all cursor-pointer" onClick={() => togglePermission(perm.id as keyof UserPermissions)}>
                            <span className="text-sm font-bold text-slate-700">{perm.label}</span>
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

              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                Save User Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
