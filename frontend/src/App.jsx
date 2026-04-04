import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoomDetails from './pages/RoomDetails';
import AdminPanel from './pages/AdminPanel';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerSignup from './pages/ManagerSignup';
import HotelDetails from './pages/HotelDetails';
import SuccessPage from './pages/SuccessPage';
import Wishlist from './pages/Wishlist';
import PaymentPage from './pages/PaymentPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './components/WishlistToast';
import { NotificationProvider } from './context/NotificationContext';

// Customer Dashboard Imports
import CustomerDashboardLayout from './pages/customer/CustomerDashboardLayout';
import CustomerOverview from './pages/customer/CustomerOverview';
import CustomerExplore from './pages/customer/CustomerExplore';
import CustomerBookings from './pages/customer/CustomerBookings';
import CustomerWishlist from './pages/customer/CustomerWishlist';
import CustomerPayments from './pages/customer/CustomerPayments';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerNotifications from './pages/customer/CustomerNotifications';
import CustomerSettings from './pages/customer/CustomerSettings';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ScrollToTop from './components/ScrollToTop';

const AppLayout = () => {
  const location = useLocation();
  const isPanel = location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin');
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <>
      {!isPanel && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hotels" element={<Rooms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/manager-signup" element={<ManagerSignup />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/hotels/:id" element={<HotelDetails />} />
        <Route element={<ProtectedRoute allowedRoles={['customer', 'admin', 'manager']} />}>
          <Route path="/dashboard" element={<CustomerDashboardLayout />}>
             <Route index element={<CustomerOverview />} />
             <Route path="explore" element={<CustomerExplore />} />
             <Route path="bookings" element={<CustomerBookings />} />
             <Route path="wishlist" element={<CustomerWishlist />} />
             <Route path="payments" element={<CustomerPayments />} />
             <Route path="profile" element={<CustomerProfile />} />
             <Route path="notifications" element={<CustomerNotifications />} />
             <Route path="settings" element={<CustomerSettings />} />
          </Route>
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Route>
        {/* Legacy redirect for old admin-login path */}
        <Route path="/admin-login" element={<Login />} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} redirectPath="/login" />}>
          <Route path="/admin/dashboard" element={<AdminPanel />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} redirectPath="/login" />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        </Route>
      </Routes>
      {!isPanel && !isDashboard && <Footer />}
    </>
  );
};

function App() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <WishlistProvider>
          <NotificationProvider>
            <Router>
              <ScrollToTop />
              <AppLayout />
            </Router>
          </NotificationProvider>
        </WishlistProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
