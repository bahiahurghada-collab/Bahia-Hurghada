
export type UserRole = 'admin' | 'reception';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'maintenance' | 'stay' | 'checked_out';
export type Currency = 'EGP' | 'USD';

export interface UserPermissions {
  canViewDashboard: boolean;
  canViewTimeline: boolean;
  canViewUnits: boolean;
  canManageUnits: boolean;
  canViewBookings: boolean;
  canManageBookings: boolean;
  canDeleteBookings: boolean;
  canViewCustomers: boolean;
  canManageCustomers: boolean;
  canDeleteCustomers: boolean;
  canViewServices: boolean;
  canManageServices: boolean;
  canViewReports: boolean;
  canViewStaff: boolean;
  canManageStaff: boolean;
  canViewLogs: boolean;
  canManageCommissions: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
}

export interface Apartment {
  id: string;
  unitNumber: string;
  floor: number;
  rooms: number;
  view: string;
  dailyPrice: number;
  monthlyPrice: number;
  maxDiscount: number;
  images: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nationality: string;
}

export interface ExtraService {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
}

export interface StayService {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  date: string;
  paymentMethod: string;
  isPaid: boolean;
}

export interface Expense {
  id: string;
  date: string;
  apartmentId?: string;
  category: 'maintenance' | 'supplies' | 'utility' | 'other' | 'commission';
  description: string;
  amount: number;
  currency: Currency;
}

export interface Booking {
  id: string;
  apartmentId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  bookingDate: string;
  receptionistName: string;
  platform: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  currency: Currency;
  status: BookingStatus;
  services: string[];
  extraServices: StayService[];
  totalAmount: number;
  discount: number;
  commissionAmount: number;
  commissionPaid: boolean;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  message: string;
  type: 'new_booking' | 'cancellation' | 'payment' | 'checkin' | 'stay_alert' | 'system';
  read: boolean;
}

export interface AppState {
  apartments: Apartment[];
  customers: Customer[];
  bookings: Booking[];
  services: ExtraService[];
  expenses: Expense[];
  logs: AuditLog[];
  notifications: AppNotification[];
  users: User[];
  currentUser: User | null;
  lastUpdated?: string; // توقيت آخر تحديث للسيرفر
}
