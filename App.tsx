
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
import { Loader2 } from 'lucide-react';

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
  canViewMaintenance: true, canManageMaintenance: true, canExportData: true
};

const DEFAULT_ADMIN: User = {
  id: 'root-admin', name: 'Super Admin', username: 'admin', password: 'admin2025',
  role: 'admin', permissions: ADMIN_PERMISSIONS, isActive: true
};

const INITIAL_STATE: AppState = {
  apartments: [], customers: [], bookings: [], services: INITIAL_SERVICES,
  expenses: [], logs: [], notifications: [], users: [DEFAULT_ADMIN], currentUser: null,
  currentExchangeRate: 50.0 // Default fallback
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
  const autoStatusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const stateRef = useRef<AppState>(INITIAL_STATE);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const generateDisplayId = () => `BH-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const fetchLiveExchangeRate = useCallback(async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data && data.rates && data.rates.EGP) {
        const newRate = parseFloat(data.rates.EGP.toFixed(2));
        setState(prev => ({ ...prev, currentExchangeRate: newRate }));
        addLog('Currency Update', `Exchange rate updated to ${newRate} EGP/USD`);
      }
    } catch (error) {
      console.error("Failed to fetch rate:", error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

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

  const triggerSync = useCallback(async (newState: AppState) => {
    if (!isSupabaseConfigured() || isSyncing) return;
    setIsSyncing(true);
    try {
      await databaseService.saveState(newState);
      setLastSyncTime(new Date());
      setSyncError(null);
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const handleStateUpdate = useCallback((newState: AppState) => {
    setState(newState);
    triggerSync(newState);
  }, [triggerSync]);

  const performSync = useCallback(async (forceUpdate: boolean = false) => {
    if (isSyncing || !isSupabaseConfigured()) return;
    setIsSyncing(true);
    try {
      const current = stateRef.current;
      if (forceUpdate) {
        await databaseService.saveState(current);
        setLastSyncTime(new Date());
      } else {
        const result = await databaseService.fetchState(current.lastUpdated);
        if (result && result.hasUpdates) {
          setState(result.state);
          setLastSyncTime(new Date());
        }
      }
    } catch (error: any) {
      setSyncError(error.message);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const runAutoStatusEngine = useCallback(() => {
    const current = stateRef.current;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().slice(0, 5);
    let hasChanges = false;
    
    const updatedBookings = current.bookings.map(b => {
      if (b.status === 'confirmed' || b.status === 'pending') {
        const checkInTime = b.checkInTime || '14:00';
        if (b.startDate < todayStr || (b.startDate === todayStr && currentTimeStr >= checkInTime)) {
          hasChanges = true;
          return { ...b, status: 'stay' as const };
        }
      }
      if (b.status === 'stay') {
        const checkOutTime = b.checkOutTime || '12:00';
        if (b.endDate < todayStr || (b.endDate === todayStr && currentTimeStr >= checkOutTime)) {
          hasChanges = true;
          return { ...b, status: 'checked_out' as const };
        }
      }
      return b;
    });

    if (hasChanges) {
      handleStateUpdate({ ...current, bookings: updatedBookings });
    }
  }, [handleStateUpdate]);

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured()) { setIsInitialLoading(false); return; }
      try {
        const result = await databaseService.fetchState();
        if (result) {
          setState(result.state);
          stateRef.current = result.state;
          setLastSyncTime(new Date());
        } else {
          // If fresh start, try fetching initial rate
          fetchLiveExchangeRate();
        }
        const savedUserId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedUserId) {
          const foundUser = (result ? result.state.users : INITIAL_STATE.users).find(u => u.id === savedUserId);
          if (foundUser && foundUser.isActive) setUser(foundUser);
        }
      } catch (e: any) {
        setSyncError(e.message);
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();

    syncTimerRef.current = setInterval(() => { performSync(false); }, 45000);
    autoStatusTimerRef.current = setInterval(() => { runAutoStatusEngine(); }, 60000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      if (autoStatusTimerRef.current) clearInterval(autoStatusTimerRef.current);
    };
  }, []);

  const handleUpdateBooking = (id: string, updates: Partial<Booking>) => {
    setState(prev => {
      const updated = prev.bookings.map(b => b.id === id ? { ...b, ...updates } : b);
      const newState = { ...prev, bookings: updated };
      setTimeout(() => triggerSync(newState), 0);
      return newState;
    });
    addLog('Update Booking', `ID: ${id}`);
  };

  const handleQuickSettle = (bookingId: string) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return;
    handleUpdateBooking(bookingId, { paidAmount: booking.totalAmount, paymentStatus: 'Paid' });
  };

  const handleFulfillService = useCallback((bookingId: string, serviceId: string, isExtra: boolean = false) => {
    setState(prev => {
      const updatedBookings = prev.bookings.map(b => {
        if (b.id !== bookingId) return b;
        if (isExtra) {
          return { ...b, extraServices: b.extraServices.map(es => es.id === serviceId ? { ...es, isFulfilled: true } : es) };
        } else {
          return { ...b, fulfilledServices: Array.from(new Set([...(b.fulfilledServices || []), serviceId])) };
        }
      });
      const newState = { ...prev, bookings: updatedBookings };
      setTimeout(() => triggerSync(newState), 0);
      return newState;
    });
    addLog('Service Delivered', `Fulfillment for ${bookingId}`);
  }, [triggerSync, addLog]);

  const handleDeleteServiceRecord = useCallback((bookingId: string, recordId: string, isExtra: boolean) => {
    setState(prev => {
      const updatedBookings = prev.bookings.map(b => {
        if (b.id !== bookingId) return b;
        if (isExtra) {
          const serviceToRemove = b.extraServices.find(es => es.id === recordId);
          const newPrice = b.totalAmount - (serviceToRemove?.price || 0);
          const newPaid = serviceToRemove?.isPaid ? b.paidAmount - (serviceToRemove?.price || 0) : b.paidAmount;
          return { 
            ...b, 
            extraServices: b.extraServices.filter(es => es.id !== recordId),
            totalAmount: newPrice,
            paidAmount: newPaid
          };
        } else {
          return { ...b, fulfilledServices: (b.fulfilledServices || []).filter(sid => sid !== recordId) };
        }
      });
      const newState = { ...prev, bookings: updatedBookings };
      setTimeout(() => triggerSync(newState), 0);
      return newState;
    });
    addLog('Archive Cleanup', `Service record removed from ${bookingId}`);
  }, [triggerSync, addLog]);

  const handleAddBooking = (b: Omit<Booking, 'id' | 'displayId'>, nc?: Omit<Customer, 'id'>) => {
    let finalCustomerId = b.customerId;
    let customers = [...state.customers];
    if (nc) {
      const newCustomerRecord: Customer = { ...nc, id: Math.random().toString(36).substr(2, 9) };
      finalCustomerId = newCustomerRecord.id;
      customers.push(newCustomerRecord);
    }
    const newBooking: Booking = { 
      ...b as Booking, 
      id: Math.random().toString(36).substr(2, 9), 
      displayId: generateDisplayId(),
      customerId: finalCustomerId, 
      extraServices: [],
      fulfilledServices: [],
      exchangeRateAtBooking: state.currentExchangeRate
    };
    const newState = { ...state, customers, bookings: [...state.bookings, newBooking] };
    handleStateUpdate(newState);
    addLog('New Booking', `Record ${newBooking.displayId} saved`);
  };

  const handleAddStayService = (bookingId: string, serviceId: string, paymentMethod: string, isPaid: boolean) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    const serviceTemplate = state.services.find(s => s.id === serviceId);
    if (!booking || !serviceTemplate) return;
    
    const newStayService: StayService = {
      id: Math.random().toString(36).substr(2, 9),
      bookingId: booking.id,
      serviceId, name: serviceTemplate.name, price: serviceTemplate.price,
      date: new Date().toISOString().split('T')[0], paymentMethod, isPaid,
      isFulfilled: false
    };

    handleUpdateBooking(bookingId, {
      extraServices: [...(booking.extraServices || []), newStayService],
      totalAmount: booking.totalAmount + serviceTemplate.price,
      paidAmount: isPaid ? booking.paidAmount + serviceTemplate.price : booking.paidAmount
    });
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
        onDeleteBooking={(id) => setState(prev => ({...prev, bookings: prev.bookings.filter(b => b.id !== id)}))}
      />
      {activeTab === 'dashboard' && (
        <Dashboard 
          state={state} 
          onAddService={handleAddStayService} 
          onUpdateBooking={handleUpdateBooking} 
          onOpenDetails={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} 
          onTabChange={setActiveTab} 
          onQuickSettle={handleQuickSettle} 
          onFulfillService={handleFulfillService}
          onUpdateRate={(newRate) => setState(prev => ({ ...prev, currentExchangeRate: newRate }))}
          onRefreshRate={fetchLiveExchangeRate}
        />
      )}
      {activeTab === 'calendar' && <BookingCalendar apartments={state.apartments} bookings={state.bookings} onBookingInitiate={(aptId, start, end) => { setBookingInitialData({ aptId, start, end }); setIsBookingModalOpen(true); }} onEditBooking={(id) => { setEditBookingId(id); setIsBookingModalOpen(true); }} state={state} />}
      {activeTab === 'apartments' && <Apartments apartments={state.apartments} userRole={user.role} onAdd={(a) => setState(prev => ({...prev, apartments: [...prev.apartments, {...a, id: Math.random().toString(36).substr(2, 9)}]}))} onUpdate={(id, u) => setState(prev => ({...prev, apartments: prev.apartments.map(a => a.id === id ? {...a, ...u} : a)}))} onDelete={(id) => setState(prev => ({...prev, apartments: prev.apartments.filter(a => a.id !== id)}))} />}
      {activeTab === 'bookings' && <Bookings state={state} userRole={user.role} userName={user.name} onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking} onCancelBooking={(id) => handleUpdateBooking(id, {status: 'cancelled'})} onDeleteBooking={(id) => setState(prev => ({...prev, bookings: prev.bookings.filter(b => b.id !== id)}))} />}
      {activeTab === 'customers' && <Customers state={state} onUpdateCustomer={(id, u) => setState(prev => ({...prev, customers: prev.customers.map(c => c.id === id ? {...c, ...u} : c)}))} onDeleteCustomer={id => setState(prev => ({...prev, customers: prev.customers.filter(c => c.id !== id)}))} permissions={user.permissions} />}
      {activeTab === 'maintenance' && <MaintenanceManagement expenses={state.expenses} apartments={state.apartments} onAddExpense={(exp) => setState(prev => ({...prev, expenses: [...prev.expenses, {...exp, id: Math.random().toString(36).substr(2, 9)}]}))} onDeleteExpense={(id) => setState(prev => ({...prev, expenses: prev.expenses.filter(e => e.id !== id)}))} />}
      {activeTab === 'commissions' && <CommissionManagement state={state} onUpdateBooking={handleUpdateBooking} />}
      {activeTab === 'reports' && <Reports state={state} />}
      {activeTab === 'services' && <ServicesManagement state={state} onAdd={s => setState(prev => ({...prev, services: [...prev.services, {...s, id: Math.random().toString(36).substr(2, 9)}]}))} onUpdate={(id, u) => setState(prev => ({...prev, services: prev.services.map(s => s.id === id ? {...s, ...u} : s)}))} onDelete={id => setState(prev => ({...prev, services: prev.services.filter(s => s.id !== id)}))} onFulfillService={handleFulfillService} onDeleteHistoryItem={handleDeleteServiceRecord} onEditBooking={handleUpdateBooking} />}
      {activeTab === 'team' && <UserManagement users={state.users} onAddUser={(u) => setState(prev => ({...prev, users: [...prev.users, {...u, id: Math.random().toString(36).substr(2, 9)} as any]}))} onUpdateUser={(id, u) => setState(prev => ({...prev, users: prev.users.map(us => us.id === id ? {...us, ...u} : us)}))} onDeleteUser={id => setState(prev => ({...prev, users: prev.users.filter(u => u.id !== id)}))} />}
      {activeTab === 'logs' && <SystemLogs state={state} onImport={async (file) => handleStateUpdate(await storageService.importData(file))} onClearLogs={() => setState(prev => ({...prev, logs: []}))} />}
    </Layout>
  );
};

export default App;
