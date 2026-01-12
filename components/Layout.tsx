
import React, { useState } from 'react';
import { LayoutDashboard, Building2, Users, CalendarDays, LogOut, ConciergeBell, History, ShieldCheck, Zap, UserCircle, Hammer, FileBarChart, BadgePercent, Briefcase, Bell, X } from 'lucide-react';
import { User, AppNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, user, onLogout, notifications, onMarkRead }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'canViewDashboard' },
    { id: 'calendar', label: 'Timeline', icon: CalendarDays, permission: 'canViewTimeline' },
    { id: 'apartments', label: 'Units', icon: Building2, permission: 'canViewUnits' },
    { id: 'owners', label: 'Owners', icon: Briefcase, permission: 'canManageUnits' }, // موديول الملاك الجديد
    { id: 'bookings', label: 'Bookings', icon: ConciergeBell, permission: 'canViewBookings' },
    { id: 'services', label: 'Amenities', icon: Zap, permission: 'canViewServices' },
    { id: 'maintenance', label: 'Expenses', icon: Hammer, permission: 'canViewMaintenance' },
    { id: 'customers', label: 'Guests', icon: Users, permission: 'canViewCustomers' },
    { id: 'commissions', label: 'Commissions', icon: BadgePercent, permission: 'canManageCommissions' },
    { id: 'reports', label: 'Audit', icon: FileBarChart, permission: 'canViewReports' },
    { id: 'team', label: 'Staff', icon: ShieldCheck, permission: 'canViewStaff' },
    { id: 'logs', label: 'System', icon: History, permission: 'canViewLogs' },
  ];

  const filteredNav = navItems.filter(item => user.permissions[item.permission as keyof typeof user.permissions]);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-900">
      <aside className="w-64 bg-slate-950 flex flex-col shadow-2xl z-40 border-r border-white/5">
        <div className="p-8 text-center shrink-0">
          <h1 className="text-3xl font-black text-white italic tracking-tighter">BAHIA<span className="text-sky-400">.</span></h1>
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.4em] mt-2">Elite PMS System</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-4 custom-scrollbar">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-sky-500 text-white font-black shadow-lg shadow-sky-500/20' 
                : 'text-slate-500 hover:bg-white/5 hover:text-white font-bold'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`} />
              <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 shrink-0 border-t border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-2xl">
            <UserCircle className="w-8 h-8 text-sky-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white truncate uppercase">{user.name}</p>
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div>
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Bahia Hurghada Terminal</h2>
             <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">{activeTab}</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all relative"
              >
                <Bell className="w-6 h-6 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-black animate-bounce border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-200 z-[100] animate-in fade-in slide-in-from-top-4">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="font-black uppercase text-xs tracking-widest">System Alerts</h4>
                    <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-slate-400"/></button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-2xl transition-all cursor-pointer ${n.read ? 'bg-slate-50 opacity-60' : 'bg-sky-50 border-l-4 border-sky-500'}`} onClick={() => onMarkRead(n.id)}>
                        <p className="text-xs font-bold text-slate-900">{n.message}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-2">{new Date(n.timestamp).toLocaleTimeString()}</p>
                      </div>
                    )) : (
                      <div className="py-10 text-center text-slate-300 font-black uppercase text-[10px]">No recent updates</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 bg-slate-950 px-6 py-2.5 rounded-full border border-slate-800">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black uppercase text-white tracking-widest">System Active</span>
            </div>
          </div>
        </header>
        <div className="p-10 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
