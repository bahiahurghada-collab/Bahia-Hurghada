
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Apartment, Booking, Customer, User, UserRole, ExtraService, AuditLog, AppNotification, UserPermissions, StayService, Expense } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Apartments from './components/Apartments';
import Bookings from './components/Bookings';
import BookingCalendar from './components/BookingCalendar';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import ServicesManagement from './components/ServicesManagement';
import MaintenanceManagement from './components/MaintenanceManagement';
import CommissionManagement from './components/CommissionManagement';
import SystemLogs from './components/SystemLogs';
import { databaseService } from './services/databaseService';
import { storageService } from './services/storageService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { Loader2, CloudOff, AlertCircle, Settings, Database, Link, Key, Copy, Check } from 'lucide-react';

const INITIAL_SERVICES: ExtraService[] = [
  { id: 's1', name: 'Standard Cleaning', price: 200, isFree: false },
  { id: 's2', name: 'Poolside Service', price: 150, isFree: false },
  { id: 's3', name: 'Airport Transfer', price: 500, isFree: false },
  { id: 's4', name: 'Continental Breakfast', price: 100, isFree: false },
];

const ADMIN_PERMISSIONS: UserPermissions = {
  canViewDashboard: true, canViewTimeline: true, canViewUnits: true, canManageUnits: true,
  canViewBookings: true, canManageBookings: true, canDeleteBookings: true, canViewCustomers: true,
  canManageCustomers: true, canDeleteCustomers: true, canViewServices: true, canManageServices: true,
  canViewReports: true, canViewStaff: true, canManageStaff: true, canViewLogs: true, canManageCommissions: true,
};

const DEFAULT_ADMIN: User = {
  id: 'root-admin', name: 'Super Admin', username: 'admin', password: 'admin2025',
  role: 'admin', permissions: ADMIN_PERMISSIONS, isActive: true
};

const INITIAL_STATE: AppState = {
  apartments: [], customers: [], bookings: [], services: INITIAL_SERVICES,
  expenses: [], logs: [], notifications: [], users: [DEFAULT_ADMIN], currentUser: null
};

const App: React.FC = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState<{ aptId: string; start: string; end: string } | null>(null);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);

  const SYSTEM_TODAY = '2026-01-07';
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const performSync = useCallback(async (forceUpdate: boolean = false) => {
    if (isSyncing || !isSupabaseConfigured()) return;
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      if (forceUpdate) {
        const success = await databaseService.saveState(state);
        if (success) {
          setLastSyncTime(new Date());
          setSyncError(null);
        }
      } else {
        const result = await databaseService.fetchState(state.lastUpdated);
        if (result && result.hasUpdates) {
          setState(result.state);
          setLastSyncTime(new Date());
        } else if (!result && !state.lastUpdated) {
          await databaseService.saveState(INITIAL_STATE);
        }
      }
    } catch (error: any) {
      setSyncError(error.message || "Connection Error");
    } finally {
      setIsSyncing(false);
    }
  }, [state, isSyncing]);

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured()) {
        setIsInitialLoading(false);
        return;
      }
      try {
        const result = await databaseService.fetchState();
        if (result) {
          setState(result.state);
          setLastSyncTime(new Date());
        } else {
          const success = await databaseService.saveState(INITIAL_STATE);
          if (success) {
             setState(INITIAL_STATE);
             setLastSyncTime(new Date());
          }
        }
      } catch (e: any) {
        setSyncError(e.message || "Failed to initialize");
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isInitialLoading || !user || !isSupabaseConfigured()) return;
    
    syncTimerRef.current = setInterval(() => {
      performSync(false);
    }, 30000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [isInitialLoading, user, performSync]);

  const copyFixCode = () => {
    navigator.clipboard.writeText("ALTER TABLE pms_data DISABLE ROW LEVEL SECURITY;");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addLog = useCallback((action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user: user?.name || 'System',
      action,
      details
    };
    setState(prev => ({ ...prev, logs: [newLog, ...prev.logs].slice(0, 100) }));
  }, [user]);

  const handleStateUpdate = useCallback((newState: AppState) => {
    setState(newState);
    if (!isSupabaseConfigured()) return;
    setIsSyncing(true);
    databaseService.saveState(newState).then((success) => {
      setIsSyncing(false);
      if (success) {
        setLastSyncTime(new Date());
        setSyncError(null);
      }
    }).catch(err => {
      setIsSyncing(false);
      setSyncError(err.message);
    });
  }, []);

  const handleUpdateBooking = (id: string, updates: Partial<Booking>) => {
    const newState = {
      ...state,
      bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates } : b)
    };
    handleStateUpdate(newState);
    addLog('Update Booking', `ID: ${id}`);
  };

  const handleAddBooking = (b: Omit<Booking, 'id'>, nc?: Omit<Customer, 'id'>) => {
    let finalCustomerId = b.customerId;
    let customers = [...state.customers];
    if (nc) {
      const newCustomerRecord: Customer = { ...nc, id: Math.random().toString(36).substr(2, 9) };
      finalCustomerId = newCustomerRecord.id;
      customers.push(newCustomerRecord);
    }
    const newBooking: Booking = { ...b as Booking, id: Math.random().toString(36).substr(2, 9), customerId: finalCustomerId };
    const newState = { ...state, customers, bookings: [...state.bookings, newBooking] };
    handleStateUpdate(newState);
    addLog('New Booking Saved', `Unit ${state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}`);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl font-black text-white tracking-tighter uppercase mb-8">BAHIA<span className="text-sky-500">.</span></div>
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-16 h-16 text-sky-500 animate-spin" />
          <div className="space-y-2">
            <p className="text-sky-400 font-black text-xs uppercase tracking-[0.4em] animate-pulse">Initializing System...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured() || (syncError && (syncError.includes("fetch") || syncError.includes("42501")))) {
    const isRLS = syncError?.includes("42501");
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database className="w-40 h-40 text-sky-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 ${isRLS ? 'bg-amber-500/20' : 'bg-rose-500/20'} rounded-2xl flex items-center justify-center`}>
                <AlertCircle className={`w-8 h-8 ${isRLS ? 'text-amber-500' : 'text-rose-500'}`} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                  {isRLS ? "Permission Needed" : "Connection Required"}
                </h2>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Supabase Sync Error</p>
              </div>
            </div>

            <div className="space-y-6">
               <div className="p-8 bg-rose-500/10 rounded-[2rem] border border-rose-500/20">
                  <p className="text-[10px] font-black text-rose-500 uppercase mb-2">Error Details:</p>
                  <p className="text-rose-200 font-mono text-sm leading-relaxed">
                    {syncError || "Configuration issue detected."}
                  </p>
               </div>

               {isRLS ? (
                 <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20">
                    <h4 className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-4">Fix Instructions:</h4>
                    <p className="text-xs text-slate-400 font-bold mb-4">You need to disable RLS on the table to allow the app to save data:</p>
                    <div className="bg-black/40 p-4 rounded-xl flex items-center justify-between group">
                       <code className="text-xs text-amber-200 font-mono">ALTER TABLE pms_data DISABLE ROW LEVEL SECURITY;</code>
                       <button onClick={copyFixCode} className="p-2 hover:bg-white/10 rounded-lg transition-all text-amber-400">
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                       </button>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-4 font-bold">Copy this and run it in Supabase SQL Editor.</p>
                 </div>
               ) : (
                 <div className="bg-sky-500/10 p-6 rounded-3xl border border-sky-500/20">
                    <h4 className="text-sky-400 font-black text-[10px] uppercase tracking-widest mb-3">Action Required:</h4>
                    <ol className="text-xs text-slate-400 space-y-2 list-decimal ml-4 font-bold">
                      <li>Go to <span className="text-sky-300">Supabase > Settings > API</span></li>
                      <li>Check your <span className="text-sky-300">URL</span> and <span className="text-sky-300">Key</span></li>
                    </ol>
                 </div>
               )}
               
               <button onClick={() => window.location.reload()} className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-sky-500 hover:text-white transition-all">Retry Connection</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-600/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 shadow-2xl border border-white/10 relative z-10">
          <div className="text-center mb-12">
            <div className="text-4xl font-black text-white tracking-tighter uppercase mb-2">BAHIA<span className="text-sky-500">.</span></div>
            <div className="h-1 w-12 bg-sky-500 mx-auto rounded-full mb-6"></div>
            <p className="text-sky-400 font-black uppercase text-[10px] tracking-[0.4em]">SYSTEM TERMINAL</p>
          </div>
          {loginError && <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black text-center animate-shake">Invalid Security Key</div>}
          <form onSubmit={(e) => {
            e.preventDefault();
            const found = state.users.find(u => u.username === loginUsername && u.password === loginPassword);
            if (found) { setUser(found); addLog('Login', found.name); } else setLoginError(true);
          }} className="space-y-6">
            <input type="text" required placeholder="Staff Username" className="w-full px-8 py-5 rounded-2xl border border-white/10 bg-white/5 !text-white font-black text-sm outline-none focus:border-sky-500 transition-all" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
            <input type="password" required placeholder="Security Key" className="w-full px-8 py-5 rounded-2xl border border-white/10 bg-white/5 !text-white font-black text-sm outline-none focus:border-sky-500 transition-all" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            <button className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-sky-500 hover:text-white transition-all shadow-xl text-xs">Authorize Entry</button>
          </form>
          {syncError && (
             <div className="mt-8 flex items-center justify-center gap-2 text-rose-400 animate-pulse">
                <CloudOff className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">{syncError}</span>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={() => setUser(null)} 
      notifications={state.notifications} onMarkRead={() => {}} 
      isSyncing={isSyncing} lastSyncTime={lastSyncTime} onManualSync={() => performSync(true)}
    >
      <Bookings 
        state={state} userRole={user.role} userName={user.name} isInternalModalOnly={true}
        externalModalOpen={isBookingModalOpen}
        onExternalModalClose={() => { setIsBookingModalOpen(false); setBookingInitialData(null); setEditBookingId(null); }}
        initialSelection={bookingInitialData} initialEditId={editBookingId}
        onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking}
        onCancelBooking={(id) => handleUpdateBooking(id, {status: 'cancelled'})}
        onDeleteBooking={(id) => handleStateUpdate({...state, bookings: state.bookings.filter(b => b.id !== id)})}
      />
      {activeTab === 'dashboard' && <Dashboard state={state} onAddService={(bid, sid, pm, ip) => {
        const service = state.services.find(s => s.id === sid);
        if (!service) return;
        const newStayService: StayService = { id: Math.random().toString(36).substr(2, 9), serviceId: sid, name: service.name, price: service.price, date: SYSTEM_TODAY, paymentMethod: pm, isPaid: ip };
        const newState = { ...state, bookings: state.bookings.map(b => b.id === bid ? { ...b, extraServices: [...(b.extraServices || []), newStayService], totalAmount: Number((b.totalAmount + service.price).toFixed(2)) } : b) };
        handleStateUpdate(newState);
      }} onUpdateBooking={handleUpdateBooking} onOpenDetails={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} onTabChange={setActiveTab} />}
      {activeTab === 'calendar' && <BookingCalendar apartments={state.apartments} bookings={state.bookings} onBookingInitiate={(aptId, start, end) => { setBookingInitialData({ aptId, start, end }); setIsBookingModalOpen(true); }} onEditBooking={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} />}
      {activeTab === 'apartments' && <Apartments apartments={state.apartments} userRole={user.role} onAdd={(a) => handleStateUpdate({...state, apartments: [...state.apartments, {...a, id: Math.random().toString(36).substr(2, 9)} ]})} onUpdate={(id, u) => handleStateUpdate({...state, apartments: state.apartments.map(a => a.id === id ? {...a, ...u} : a)})} onDelete={(id) => handleStateUpdate({...state, apartments: state.apartments.filter(a => a.id !== id)})} />}
      {activeTab === 'bookings' && <Bookings state={state} userRole={user.role} userName={user.name} onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking} onCancelBooking={(id) => handleUpdateBooking(id, {status: 'cancelled'})} onDeleteBooking={(id) => handleStateUpdate({...state, bookings: state.bookings.filter(b => b.id !== id)})} />}
      {activeTab === 'maintenance' && <MaintenanceManagement expenses={state.expenses} apartments={state.apartments} onAddExpense={(exp) => handleStateUpdate({...state, expenses: [...state.expenses, {...exp, id: Math.random().toString(36).substr(2, 9)} ]})} onDeleteExpense={(id) => handleStateUpdate({...state, expenses: state.expenses.filter(e => e.id !== id)})} />}
      {activeTab === 'commissions' && <CommissionManagement state={state} onUpdateBooking={handleUpdateBooking} />}
      {activeTab === 'reports' && <Reports state={state} />}
      {activeTab === 'services' && <ServicesManagement services={state.services} onAdd={s => handleStateUpdate({...state, services: [...state.services, {...s, id: Math.random().toString(36).substr(2, 9)} ]})} onUpdate={(id, u) => handleStateUpdate({...state, services: state.services.map(s => s.id === id ? {...s, ...u} : s)})} onDelete={id => handleStateUpdate({...state, services: state.services.filter(s => s.id !== id)})} />}
      {activeTab === 'team' && <UserManagement users={state.users} onAddUser={(u) => handleStateUpdate({...state, users: [...state.users, {...u, id: Math.random().toString(36).substr(2, 9)} as any ]})} onUpdateUser={(id, u) => handleStateUpdate({...state, users: state.users.map(us => us.id === id ? {...us, ...u} : us)})} onDeleteUser={id => handleStateUpdate({...state, users: state.users.filter(u => u.id !== id)})} />}
      {activeTab === 'logs' && <SystemLogs state={state} onImport={async (file) => handleStateUpdate(await storageService.importData(file))} onClearLogs={() => handleStateUpdate({...state, logs: []})} />}
    </Layout>
  );
};

export default App;
