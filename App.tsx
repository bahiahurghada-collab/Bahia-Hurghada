
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Apartment, Booking, Customer, User, UserRole, ExtraService, AuditLog, AppNotification, UserPermissions, StayService, Expense } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Apartments from './components/Apartments';
import Bookings from './components/Bookings';
import BookingCalendar from './components/BookingCalendar';
import Reports from './components/Reports';
import Customers from './components/Customers';
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

const SESSION_STORAGE_KEY = 'bahia_active_user_id';

const App: React.FC = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState<{ aptId: string; start: string; end: string } | null>(null);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);

  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

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
        let currentState = INITIAL_STATE;
        if (result) {
          currentState = result.state;
          setState(currentState);
          setLastSyncTime(new Date());
        } else {
          const success = await databaseService.saveState(INITIAL_STATE);
          if (success) {
             setState(INITIAL_STATE);
             setLastSyncTime(new Date());
          }
        }

        const savedUserId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedUserId) {
          const foundUser = currentState.users.find(u => u.id === savedUserId);
          if (foundUser && foundUser.isActive) {
            setUser(foundUser);
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

  const handleAddStayService = (bookingId: string, serviceId: string, paymentMethod: string, isPaid: boolean) => {
    const serviceTemplate = state.services.find(s => s.id === serviceId);
    if (!serviceTemplate) return;

    const newStayService: StayService = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId,
      name: serviceTemplate.name,
      price: serviceTemplate.price,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      isPaid
    };

    const newState = {
      ...state,
      bookings: state.bookings.map(b => {
        if (b.id === bookingId) {
          const currentExtra = b.extraServices || [];
          return {
            ...b,
            extraServices: [...currentExtra, newStayService],
            // Update paid amount only if service is paid now
            paidAmount: isPaid ? b.paidAmount + serviceTemplate.price : b.paidAmount,
            totalAmount: b.totalAmount + serviceTemplate.price
          };
        }
        return b;
      })
    };
    
    handleStateUpdate(newState);
    const aptNum = state.apartments.find(a => a.id === state.bookings.find(b => b.id === bookingId)?.apartmentId)?.unitNumber;
    addLog('Add Service', `Room ${aptNum}: ${serviceTemplate.name}`);
  };

  const handleAddBooking = (b: Omit<Booking, 'id'>, nc?: Omit<Customer, 'id'>) => {
    let finalCustomerId = b.customerId;
    let customers = [...state.customers];
    if (nc) {
      const newCustomerRecord: Customer = { ...nc, id: Math.random().toString(36).substr(2, 9) };
      finalCustomerId = newCustomerRecord.id;
      customers.push(newCustomerRecord);
    }
    const newBooking: Booking = { ...b as Booking, id: Math.random().toString(36).substr(2, 9), customerId: finalCustomerId, extraServices: [] };
    const newState = { ...state, customers, bookings: [...state.bookings, newBooking] };
    handleStateUpdate(newState);
    addLog('New Booking Saved', `Unit ${state.apartments.find(a => a.id === b.apartmentId)?.unitNumber}`);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl font-black text-white tracking-tighter uppercase mb-8">BAHIA<span className="text-sky-500">.</span></div>
        <Loader2 className="w-16 h-16 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 shadow-2xl border border-white/10 relative z-10">
          <div className="text-center mb-12">
            <div className="text-4xl font-black text-white tracking-tighter uppercase mb-2">BAHIA<span className="text-sky-500">.</span></div>
            <p className="text-sky-400 font-black uppercase text-[10px] tracking-[0.4em]">SYSTEM TERMINAL</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const found = state.users.find(u => u.username === loginUsername && u.password === loginPassword);
            if (found) { 
              setUser(found); 
              localStorage.setItem(SESSION_STORAGE_KEY, found.id);
              addLog('Login', found.name); 
            }
          }} className="space-y-6">
            <input type="text" required placeholder="Staff Username" className="w-full px-8 py-5 rounded-2xl border border-white/10 bg-white/5 !text-white font-black text-sm outline-none" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
            <input type="password" required placeholder="Security Key" className="w-full px-8 py-5 rounded-2xl border border-white/10 bg-white/5 !text-white font-black text-sm outline-none" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            <button className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-sky-500 hover:text-white transition-all shadow-xl text-xs">Authorize Entry</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={handleLogout} 
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
      {activeTab === 'dashboard' && <Dashboard state={state} onAddService={handleAddStayService} onUpdateBooking={handleUpdateBooking} onOpenDetails={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} onTabChange={setActiveTab} />}
      {activeTab === 'calendar' && <BookingCalendar apartments={state.apartments} bookings={state.bookings} onBookingInitiate={(aptId, start, end) => { setBookingInitialData({ aptId, start, end }); setIsBookingModalOpen(true); }} onEditBooking={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} />}
      {activeTab === 'apartments' && <Apartments apartments={state.apartments} userRole={user.role} onAdd={(a) => handleStateUpdate({...state, apartments: [...state.apartments, {...a, id: Math.random().toString(36).substr(2, 9)} ]})} onUpdate={(id, u) => handleStateUpdate({...state, apartments: state.apartments.map(a => a.id === id ? {...a, ...u} : a)})} onDelete={(id) => handleStateUpdate({...state, apartments: state.apartments.filter(a => a.id !== id)})} />}
      {activeTab === 'bookings' && <Bookings state={state} userRole={user.role} userName={user.name} onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking} onCancelBooking={(id) => handleUpdateBooking(id, {status: 'cancelled'})} onDeleteBooking={(id) => handleStateUpdate({...state, bookings: state.bookings.filter(b => b.id !== id)})} />}
      {activeTab === 'customers' && <Customers state={state} />}
      {activeTab === 'maintenance' && <MaintenanceManagement expenses={state.expenses} apartments={state.apartments} onAddExpense={(exp) => handleStateUpdate({...state, expenses: [...state.expenses, {...exp, id: Math.random().toString(36).substr(2, 9)} ]})} onDeleteExpense={(id) => handleStateUpdate({...state, expenses: state.expenses.filter(e => e.id !== id)})} />}
      {activeTab === 'commissions' && <CommissionManagement state={state} onUpdateBooking={handleUpdateBooking} />}
      {activeTab === 'reports' && <Reports state={state} />}
      {activeTab === 'services' && <ServicesManagement state={state} onAdd={s => handleStateUpdate({...state, services: [...state.services, {...s, id: Math.random().toString(36).substr(2, 9)} ]})} onUpdate={(id, u) => handleStateUpdate({...state, services: state.services.map(s => s.id === id ? {...s, ...u} : s)})} onDelete={id => handleStateUpdate({...state, services: state.services.filter(s => s.id !== id)})} />}
      {activeTab === 'team' && <UserManagement users={state.users} onAddUser={(u) => handleStateUpdate({...state, users: [...state.users, {...u, id: Math.random().toString(36).substr(2, 9)} as any ]})} onUpdateUser={(id, u) => handleStateUpdate({...state, users: state.users.map(us => us.id === id ? {...us, ...u} : us)})} onDeleteUser={id => handleStateUpdate({...state, users: state.users.filter(u => u.id !== id)})} />}
      {activeTab === 'logs' && <SystemLogs state={state} onImport={async (file) => handleStateUpdate(await storageService.importData(file))} onClearLogs={() => handleStateUpdate({...state, logs: []})} />}
    </Layout>
  );
};

export default App;
