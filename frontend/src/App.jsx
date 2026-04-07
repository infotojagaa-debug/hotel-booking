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
import HotelMapView from './pages/HotelMapView';
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
import MobileNav from './components/MobileNav';

const AppLayout = () => {
  const location = useLocation();
  const isPanel = location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin') || location.pathname === '/hotels/map';
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isCheckout = location.pathname.startsWith('/payment') || location.pathname.startsWith('/success');
  const isDetailsPage = location.pathname.startsWith('/hotels/') || location.pathname.startsWith('/rooms/');

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Elite immersive pages should hide global navigation to prevent UI overlapping
  // We keep dashboard out of immersive so it has the site navbar and footer
  const isImmersivePage = isPanel || isCheckout || isDetailsPage;
  const hideNavbar = isPanel || (isMobile && location.pathname === '/hotels');

  return (
    <>
      {!hideNavbar && !isImmersivePage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        {/* (Rest of the routes remain unchanged...) */}
        <Route path="/hotels" element={<Rooms />} />
        <Route path="/hotels/map" element={<HotelMapView />} />
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
      {!isImmersivePage && !isDashboard && <Footer />}
      
      {/* Global Mobile Navigation Hub */}
      {isMobile && !isImmersivePage && <MobileNav />}
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
