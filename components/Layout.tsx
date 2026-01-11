
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'canViewDashboard' },
    { id: 'calendar', label: 'Timeline', icon: CalendarDays, permission: 'canViewTimeline' },
    { id: 'apartments', label: 'Units', icon: Building2, permission: 'canViewUnits' },
    { id: 'bookings', label: 'Reservations', icon: ConciergeBell, permission: 'canViewBookings' },
    { id: 'maintenance', label: 'Maintenance', icon: Hammer, permission: 'canManageUnits' },
    { id: 'commissions', label: 'Sales Commission', icon: BadgePercent, permission: 'canManageCommissions' },
    { id: 'customers', label: 'Guests', icon: Users, permission: 'canViewCustomers' },
    { id: 'services', label: 'Services', icon: Zap, permission: 'canViewServices' },
    { id: 'reports', label: 'Finance Hub', icon: FileBarChart, permission: 'canViewReports' },
    { id: 'team', label: 'Our Team', icon: ShieldCheck, permission: 'canViewStaff' },
    { id: 'logs', label: 'System & Backup', icon: History, permission: 'canViewLogs' },
  ];

  const filteredNav = navItems.filter(item => user.permissions[item.permission as keyof typeof user.permissions]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-900">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-40 relative">
        <div className="p-10 text-center shrink-0">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1">
              BAHIA<span className="text-sky-600">.</span>
            </div>
            <div className="h-0.5 w-8 bg-sky-600 mt-1 rounded-full"></div>
            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3">HURGHADA PREMIUM</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto pt-2 pb-20 scrollbar-hide">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-slate-900 text-white font-bold shadow-xl shadow-slate-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-900'}`} />
              <span className="text-[13px] tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto bg-white border-t border-slate-50 shrink-0">
          <div className="bg-slate-50 p-4 rounded-3xl mb-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-900 border border-slate-200 shadow-sm">
                <UserCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-900 truncate uppercase">{user.name}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all font-black uppercase tracking-widest text-[8px] border border-rose-100">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div>
             <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">{activeTab.replace('_', ' ')} Hub</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isSyncing ? 'text-sky-500' : 'text-emerald-500'}`}>
                    {isSyncing ? 'Syncing...' : 'Live Cloud'}
                  </span>
                  {isSyncing ? <Loader2 className="w-3 h-3 text-sky-500 animate-spin" /> : <CheckCircle className="w-3 h-3 text-emerald-500" />}
                </div>
                <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">
                  Last: {lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </p>
              </div>
              <button 
                onClick={onManualSync} 
                disabled={isSyncing}
                className={`p-2 rounded-lg transition-all ${isSyncing ? 'bg-slate-200 text-slate-400' : 'bg-white text-slate-600 hover:bg-slate-900 hover:text-white shadow-sm border border-slate-200'}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl relative border border-slate-200 shadow-sm transition-all">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-lg shadow-md animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>
        <div className="p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
