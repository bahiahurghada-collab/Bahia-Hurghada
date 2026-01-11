
import React, { useState } from 'react';
import { 
  LayoutDashboard, Building2, Users, CalendarDays, LogOut, ConciergeBell,
  Bell, History, X, FileBarChart, ShieldCheck, Zap, UserCircle, Hammer,
  BadgePercent, Cloud, Loader2, CheckCircle, RefreshCw
} from 'lucide-react';
import { User, AppNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onTabChange, user, onLogout, notifications, onMarkRead, isSyncing, lastSyncTime, onManualSync
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard, permission: 'canViewDashboard' },
    { id: 'calendar', label: 'Timeline', icon: CalendarDays, permission: 'canViewTimeline' },
    { id: 'apartments', label: 'Units', icon: Building2, permission: 'canViewUnits' },
    { id: 'bookings', label: 'Bookings', icon: ConciergeBell, permission: 'canViewBookings' },
    { id: 'maintenance', label: 'Service', icon: Hammer, permission: 'canManageUnits' },
    { id: 'commissions', label: 'Sales', icon: BadgePercent, permission: 'canManageCommissions' },
    { id: 'customers', label: 'Guests', icon: Users, permission: 'canViewCustomers' },
    { id: 'services', label: 'Amenities', icon: Zap, permission: 'canViewServices' },
    { id: 'reports', label: 'Finance', icon: FileBarChart, permission: 'canViewReports' },
    { id: 'team', label: 'Staff', icon: ShieldCheck, permission: 'canViewStaff' },
    { id: 'logs', label: 'System', icon: History, permission: 'canViewLogs' },
  ];

  const filteredNav = navItems.filter(item => user.permissions[item.permission as keyof typeof user.permissions]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden text-slate-900 text-sm">
      <aside className="w-60 bg-slate-950 flex flex-col shadow-2xl z-40 relative">
        <div className="p-6 text-center shrink-0">
          <div className="flex flex-col items-center">
            <div className="text-xl font-black tracking-tighter text-white flex items-center gap-1">
              BAHIA<span className="text-sky-400">.</span>
            </div>
            <p className="text-[6px] text-sky-400/50 font-black uppercase tracking-[0.5em] mt-1">MANAGEMENT OS</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2 pb-20 custom-scrollbar">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-sky-500 text-white font-black shadow-lg shadow-sky-900/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white font-bold'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-sky-400'}`} />
              <span className="text-[12px] tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto bg-slate-900/50 shrink-0">
          <div className="bg-white/5 p-3 rounded-2xl mb-2 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-500/30">
                <UserCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white truncate uppercase">{user.name}</p>
                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all font-black uppercase tracking-widest text-[8px]">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col bg-slate-50">
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
             <div className="w-1 h-4 bg-sky-500 rounded-full"></div>
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab.replace('_', ' ')} Hub</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isSyncing ? 'text-sky-500' : 'text-emerald-500'}`}>
                    {isSyncing ? 'Sync' : 'Live'}
                  </span>
                  {isSyncing ? <Loader2 className="w-2.5 h-2.5 text-sky-500 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                </div>
              </div>
              <button onClick={onManualSync} disabled={isSyncing} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
            </div>
          </div>
        </header>
        <div className="p-6 max-w-[1500px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
