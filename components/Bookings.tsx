
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Building, Trash2, Edit2, Search, X, Wallet, 
  Calendar, Zap, UserCheck, RefreshCw, AlertTriangle, Hammer,
  User as UserIcon, Phone, Mail, Globe, Clock, CreditCard, StickyNote, Check,
  ConciergeBell, Eye, BadgePercent, Printer, FileText, Download
} from 'lucide-react';
import { AppState, Booking, Customer, PaymentStatus, BookingStatus, Currency, StayService } from '../types';
import { PLATFORMS, PAYMENT_METHODS, CURRENCIES, NATIONALITIES, USD_TO_EGP_RATE } from '../constants';

interface BookingsProps {
  state: AppState;
  onAddBooking: (booking: Omit<Booking, 'id'>, newCustomer?: Omit<Customer, 'id'>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onCancelBooking: (id: string) => void;
  onDeleteBooking: (id: string) => void;
  userRole: 'admin' | 'reception';
  userName: string;
  isInternalModalOnly?: boolean;
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
  initialSelection?: { aptId: string; start: string; end: string } | null;
  initialEditId?: string | null;
}

const Bookings: React.FC<BookingsProps> = ({ 
  state, onAddBooking, onUpdateBooking, onCancelBooking, onDeleteBooking, userRole, userName, 
  isInternalModalOnly, externalModalOpen, onExternalModalClose, initialSelection, initialEditId 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'stay'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  // تحديث التاريخ ليكون ديناميكياً
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    apartmentId: '', customerId: 'new',
    newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' },
    startDate: todayStr, endDate: '', checkInTime: '14:00', checkOutTime: '12:00',
    platform: 'Direct', paymentMethod: 'Cash', currency: 'EGP' as Currency,
    paidAmount: 0, discount: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed' as BookingStatus,
    notes: '', receptionistName: userName, selectedServiceIds: [] as string[],
    extraServices: [] as StayService[]
  });

  useEffect(() => {
    if (externalModalOpen) setIsModalOpen(true);
    else if (!isInternalModalOnly) setIsModalOpen(false);
  }, [externalModalOpen, isInternalModalOnly]);

  useEffect(() => {
    if (initialSelection) {
      setFormData(prev => ({ 
        ...prev, 
        apartmentId: initialSelection.aptId, 
        startDate: initialSelection.start, 
        endDate: initialSelection.end || initialSelection.start 
      }));
    }
  }, [initialSelection]);

  useEffect(() => {
    if (initialEditId) {
      const b = state.bookings.find(x => x.id === initialEditId);
      if (b) startEdit(b);
    }
  }, [initialEditId, state.bookings]);

  const currentApt = useMemo(() => state.apartments.find(a => a.id === formData.apartmentId), [formData.apartmentId, state.apartments]);
  const currentCust = useMemo(() => {
    if (formData.customerId === 'new') return formData.newCustomer;
    return state.customers.find(c => c.id === formData.customerId);
  }, [formData.customerId, formData.newCustomer, state.customers]);

  const finance = useMemo(() => {
    if (formData.status === 'maintenance') return { total: 0, remaining: 0, nights: 0, servicesTotal: 0, basePrice: 0 };

    if (!currentApt || !formData.startDate || !formData.endDate) return { total: 0, remaining: 0, nights: 0, servicesTotal: 0, basePrice: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    let basePrice = (nights >= 30 && currentApt.monthlyPrice > 0) ? (nights / 30) * currentApt.monthlyPrice : nights * currentApt.dailyPrice;
    
    if (formData.currency === 'USD') basePrice = basePrice / USD_TO_EGP_RATE;

    const catalogServicesTotal = state.services
      .filter(s => formData.selectedServiceIds.includes(s.id))
      .reduce((a, b) => {
        let price = b.price;
        if (formData.currency === 'USD') price = price / USD_TO_EGP_RATE;
        return a + price;
      }, 0);

    const extraServicesTotal = formData.extraServices.reduce((a, b) => a + b.price, 0);
      
    const total = Number((basePrice + catalogServicesTotal + extraServicesTotal - formData.discount).toFixed(2));
    return { 
      total, 
      remaining: Number((total - formData.paidAmount).toFixed(2)), 
      nights, 
      servicesTotal: catalogServicesTotal + extraServicesTotal,
      basePrice
    };
  }, [formData, currentApt, state.services]);

  useEffect(() => {
    if (formData.paidAmount > finance.total && finance.total > 0) {
      setAmountError(`Paid amount cannot exceed total (${finance.total} ${formData.currency})`);
    } else {
      setAmountError(null);
    }
  }, [formData.paidAmount, finance.total, formData.currency]);

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountError) return;

    const { customerId, newCustomer, selectedServiceIds, extraServices, ...rest } = formData;
    
    const newExtraServicesFromCatalog: StayService[] = state.services
      .filter(s => selectedServiceIds.includes(s.id))
      .map(s => {
        let price = s.price;
        if (formData.currency === 'USD') price = price / USD_TO_EGP_RATE;
        return {
          id: Math.random().toString(36).substr(2, 9), 
          serviceId: s.id, 
          name: s.name, 
          price: Number(price.toFixed(2)), 
          date: todayStr,
          paymentMethod: formData.paymentMethod,
          isPaid: formData.paidAmount >= finance.total
        };
      });
    
    const finalExtraServices = [...extraServices, ...newExtraServicesFromCatalog];

    if (editingBookingId) {
      onUpdateBooking(editingBookingId, { 
        ...rest, 
        customerId: customerId === 'new' ? '' : customerId,
        services: selectedServiceIds,
        extraServices: finalExtraServices, 
        totalAmount: finance.total,
        paymentStatus: finance.remaining <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Unpaid')
      });
    } else {
      onAddBooking({ 
        ...rest, 
        customerId: customerId === 'new' ? '' : customerId,
        services: selectedServiceIds,
        bookingDate: todayStr, 
        totalAmount: finance.total, 
        extraServices: finalExtraServices, 
        paymentStatus: finance.remaining <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Unpaid')
      }, customerId === 'new' ? newCustomer : undefined);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowInvoice(false);
    setEditingBookingId(null);
    onExternalModalClose?.();
    setFormData({
      apartmentId: '', customerId: 'new', newCustomer: { name: '', phone: '', email: '', nationality: 'Egyptian' },
      startDate: todayStr, endDate: '', checkInTime: '14:00', checkOutTime: '12:00',
      platform: 'Direct', paymentMethod: 'Cash', currency: 'EGP',
      paidAmount: 0, discount: 0, commissionAmount: 0, commissionPaid: false, status: 'confirmed', notes: '', receptionistName: userName, selectedServiceIds: [],
      extraServices: []
    });
  };

  const startEdit = (b: Booking) => {
    setEditingBookingId(b.id);
    const cust = state.customers.find(c => c.id === b.customerId);
    setFormData({ 
      ...b, 
      checkInTime: b.checkInTime || '14:00',
      checkOutTime: b.checkOutTime || '12:00',
      notes: b.notes || '',
      newCustomer: cust ? { 
        name: cust.name, 
        phone: cust.phone, 
        email: cust.email || '', 
        nationality: cust.nationality 
      } : { name: '', phone: '', email: '', nationality: 'Egyptian' }, 
      selectedServiceIds: b.services || [],
      extraServices: b.extraServices || []
    });
    setIsModalOpen(true);
  };

  const removeExtraService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      extraServices: prev.extraServices.filter(s => s.id !== id)
    }));
  };

  const filteredBookings = useMemo(() => {
    return state.bookings.filter(b => {
      const customer = state.customers.find(c => c.id === b.customerId);
      const apartment = state.apartments.find(a => a.id === b.apartmentId);
      const matchSearch = searchQuery === '' || 
        customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apartment?.unitNumber.includes(searchQuery);
      const matchTab = activeSubTab === 'all' || b.status === 'stay';
      return matchSearch && matchTab;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [state.bookings, searchQuery, activeSubTab, state.customers, state.apartments]);

  if (isInternalModalOnly && !isModalOpen) return null;

  return (
    <div className="space-y-10 pb-32">
      {/* ... بقية كود المكون (لم يتغير) ... */}
    </div>
  );
};

export default Bookings;
