
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Apartment, Booking, Customer, User, ExtraService, UserPermissions, AuditLog, Owner, AppNotification } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Apartments from './components/Apartments';
import OwnersManagement from './components/OwnersManagement';
import Bookings from './components/Bookings';
import BookingCalendar from './components/BookingCalendar';
import Reports from './components/Reports';
import Customers from './components/Customers';
import UserManagement from './components/UserManagement';
import ServicesManagement from './components/ServicesManagement';
import MaintenanceManagement from './components/MaintenanceManagement';
import CommissionManagement from './components/CommissionManagement';
import SystemLogs from './components/SystemLogs';
import { storageService } from './services/storageService';
import { ShieldAlert, Key, User as UserIcon, Loader2, Sparkles, RotateCcw } from 'lucide-react';

const INITIAL_SERVICES: ExtraService[] = [
  { id: 's1', name: 'Premium Cleaning', price: 300, isFree: false },
  { id: 's2', name: 'Airport Transfer', price: 500, isFree: false },
  { id: 's3', name: 'Laundry Service', price: 150, isFree: false },
];

const ADMIN_PERMISSIONS: UserPermissions = {
  canViewDashboard: true, canViewTimeline: true, canViewUnits: true, canManageUnits: true,
  canViewBookings: true, canManageBookings: true, canDeleteBookings: true, canViewCustomers: true,
  canManageCustomers: true, canDeleteCustomers: true, canViewServices: true, canManageServices: true,
  canViewReports: true, canViewStaff: true, canManageStaff: true, canViewLogs: true, canManageCommissions: true,
  canViewMaintenance: true, canManageMaintenance: true, canExportData: true
};

const DEFAULT_ADMIN: User = {
  id: 'root-admin', name: 'Bahia Director', username: 'admin', password: 'admin',
  role: 'admin', permissions: ADMIN_PERMISSIONS, isActive: true
};

const INITIAL_STATE: AppState = {
  apartments: [], owners: [], customers: [], bookings: [], services: INITIAL_SERVICES,
  expenses: [], logs: [], notifications: [], users: [DEFAULT_ADMIN], currentUser: null,
  currentExchangeRate: 50.0 
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const loaded = storageService.load();
    if (!loaded) return INITIAL_STATE;
    if (!loaded.users || loaded.users.length === 0) {
      return { ...loaded, users: [DEFAULT_ADMIN] };
    }
    // ضمان وجود مصفوفة الملاك في البيانات المحملة
    if (!loaded.owners) loaded.owners = [];
    if (!loaded.notifications) loaded.notifications = [];
    return loaded;
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInit, setBookingInit] = useState<any>(null);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);

  useEffect(() => {
    storageService.save(state);
  }, [state]);

  const addLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user: user?.name || 'System',
      action,
      details
    };
    setState(prev => ({ ...prev, logs: [newLog, ...prev.logs].slice(0, 100) }));
  };

  const addNotification = (message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      message,
      type,
      read: false
    };
    setState(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications].slice(0, 50) }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    setTimeout(() => {
      const found = state.users.find(u => 
        u.username.toLowerCase() === loginForm.user.toLowerCase() && 
        u.password === loginForm.pass
      );

      if (found) {
        setUser(found);
        addLog('Login', `Session initiated for ${found.name}`);
        addNotification(`Welcome back, ${found.name}! Session started.`, 'system');
      } else {
        setLoginError("Access Denied: Invalid Credentials");
      }
      setIsLoggingIn(false);
    }, 800);
  };

  const handleRestoreV15 = () => {
    if (window.confirm("Restore V15? Data will remain safe.")) {
      setState(prev => ({
        ...prev,
        users: prev.users.find(u => u.username === 'admin') 
          ? prev.users 
          : [DEFAULT_ADMIN, ...prev.users],
        currentExchangeRate: 50.0
      }));
      setLoginForm({ user: 'admin', pass: 'admin' });
      setLoginError("V15 Stable Core Restored.");
    }
  };

  const handleAddBooking = (b: any, nc?: any) => {
    let finalCustId = b.customerId;
    let customers = [...state.customers];
    if (nc) {
      const newCust: Customer = { ...nc, id: Math.random().toString(36).substr(2, 9) };
      finalCustId = newCust.id;
      customers.push(newCust);
    }
    const newBooking: Booking = { 
      ...b, 
      id: Math.random().toString(36).substr(2, 9), 
      displayId: `BH-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      customerId: finalCustId, 
      extraServices: b.extraServices || [],
      fulfilledServices: b.fulfilledServices || []
    };
    setState(prev => ({ ...prev, customers, bookings: [newBooking, ...prev.bookings] }));
    addLog('New Booking', `Created folio ${newBooking.displayId}`);
    addNotification(`New Booking Created: ${newBooking.displayId}`, 'new_booking');
  };

  const handleUpdateBooking = (id: string, updates: Partial<Booking>) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
    addLog('Update Booking', `Modified folio ${id}`);
  };

  const handleMarkNotifRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        
        <div className="w-full max-w-md bg-white rounded-[3.5rem] p-12 shadow-2xl border-4 border-slate-900 relative z-10 animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-slate-950 rounded-3xl mb-6 shadow-xl">
              <Sparkles className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">BAHIA<span className="text-sky-500">.</span></h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mt-3">Elite PMS System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-bounce">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{loginError}</p>
              </div>
            )}
            <div className="relative group">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-950 transition-colors" />
              <input type="text" required placeholder="Access ID" className="w-full p-6 pl-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-950 focus:border-slate-950 outline-none transition-all" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            </div>
            <div className="relative group">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-950 transition-colors" />
              <input type="password" required placeholder="Security Key" className="w-full p-6 pl-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-950 focus:border-slate-950 outline-none transition-all" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
            </div>
            <button disabled={isLoggingIn} className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-sky-600 transition-all shadow-2xl border-b-8 border-slate-800 flex items-center justify-center gap-3">
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Terminal"}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-100 pt-8">
            <button onClick={handleRestoreV15} className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-sky-500 transition-colors flex items-center justify-center gap-2 mx-auto group">
              <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" /> System Rescue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={() => setUser(null)} notifications={state.notifications} onMarkRead={handleMarkNotifRead}>
      <Bookings 
        state={state} userRole={user.role} userName={user.name} isInternalModalOnly={true}
        externalModalOpen={isBookingModalOpen}
        onExternalModalClose={() => { setIsBookingModalOpen(false); setBookingInit(null); setEditBookingId(null); }}
        initialSelection={bookingInit} initialEditId={editBookingId}
        onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking}
        onDeleteBooking={(id) => setState(prev => ({...prev, bookings: prev.bookings.filter(b => b.id !== id)}))}
      />
      {activeTab === 'dashboard' && <Dashboard state={state} onAddService={() => {}} onUpdateBooking={handleUpdateBooking} onOpenDetails={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} onTabChange={setActiveTab} />}
      {activeTab === 'calendar' && <BookingCalendar apartments={state.apartments} bookings={state.bookings} onBookingInitiate={(aptId, start, end) => { setBookingInit({ aptId, start, end }); setIsBookingModalOpen(true); }} onEditBooking={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} state={state} />}
      {activeTab === 'apartments' && <Apartments apartments={state.apartments} owners={state.owners} userRole={user.role} onAdd={(a) => setState(prev => ({...prev, apartments: [...prev.apartments, {...a, id: Math.random().toString(36).substr(2, 9)}]}))} onUpdate={(id, u) => setState(prev => ({...prev, apartments: prev.apartments.map(a => a.id === id ? {...a, ...u} : a)}))} onDelete={(id) => setState(prev => ({...prev, apartments: prev.apartments.filter(a => a.id !== id)}))} />}
      {activeTab === 'owners' && <OwnersManagement owners={state.owners} apartments={state.apartments} onAdd={(o) => setState(prev => ({...prev, owners: [...prev.owners, {...o, id: Math.random().toString(36).substr(2, 9)}]}))} onUpdate={(id, u) => setState(prev => ({...prev, owners: prev.owners.map(o => o.id === id ? {...o, ...u} : o)}))} onDelete={(id) => setState(prev => ({...prev, owners: prev.owners.filter(o => o.id !== id)}))} />}
      {activeTab === 'bookings' && <Bookings state={state} userRole={user.role} userName={user.name} onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking} onDeleteBooking={(id) => setState(prev => ({...prev, bookings: prev.bookings.filter(b => b.id !== id)}))} />}
      {activeTab === 'customers' && <Customers state={state} onUpdateCustomer={(id, u) => setState(prev => ({...prev, customers: prev.customers.map(c => c.id === id ? {...c, ...u} : c)}))} onDeleteCustomer={id => setState(prev => ({...prev, customers: prev.customers.filter(c => c.id !== id)}))} permissions={user.permissions} />}
      {activeTab === 'maintenance' && <MaintenanceManagement expenses={state.expenses} apartments={state.apartments} onAddExpense={(exp) => setState(prev => ({...prev, expenses: [...prev.expenses, {...exp, id: Math.random().toString(36).substr(2, 9)}]}))} onDeleteExpense={(id) => setState(prev => ({...prev, expenses: prev.expenses.filter(e => e.id !== id)}))} />}
      {activeTab === 'reports' && <Reports state={state} />}
      {activeTab === 'services' && <ServicesManagement state={state} onAdd={(s) => setState(p => ({...p, services: [...p.services, {...s, id: Math.random().toString(36).substr(2, 9)}]}))} onUpdate={(id, u) => setState(p => ({...p, services: p.services.map(s => s.id === id ? {...s, ...u} : s)}))} onDelete={(id) => setState(p => ({...p, services: p.services.filter(s => s.id !== id)}))} onFulfillService={() => {}} />}
      {activeTab === 'commissions' && <CommissionManagement state={state} onUpdateBooking={handleUpdateBooking} />}
      {activeTab === 'team' && <UserManagement users={state.users} onAddUser={(u) => setState(prev => ({...prev, users: [...prev.users, {...u, id: Math.random().toString(36).substr(2, 9)} as any]}))} onUpdateUser={(id, u) => setState(prev => ({...prev, users: prev.users.map(us => us.id === id ? {...us, ...u} : us)}))} onDeleteUser={id => setState(prev => ({...prev, users: prev.users.filter(u => u.id !== id)}))} />}
      {activeTab === 'logs' && <SystemLogs state={state} onImport={(f) => storageService.importData(f).then(setState)} onClearLogs={() => setState(p => ({...p, logs: []}))} />}
    </Layout>
  );
};

export default App;
