import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './notifications/NotificationBell';

const Navbar = () => {
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin')) {
      return null;
  }

  // Use a solid navigation bar except on the homepage where it starts transparent until scrolled.
  const isHomePage = location.pathname === '/';
  
  return (
    <nav className={`custom-navbar ${!isHomePage || scrolled ? 'scrolled-solid' : 'transparent-start'}`}>
      <div className="navbar-inner-user max-w-[1450px] mx-auto flex items-center justify-between">
        
        {/* LEFT – Logo */}
        <Link className="navbar-brand-custom flex-shrink-0 opacity-100 hover:opacity-80 transition-opacity flex items-center gap-2" to="/">
          <div className="brand-icon-wrapper">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 1v3" strokeWidth="2.5" />
              <path d="M7 3l1.5 1.5" strokeWidth="2.5" />
              <path d="M17 3l-1.5 1.5" strokeWidth="2.5" />
              <path d="M3.5 6l2 1" strokeWidth="2.5" />
              <path d="M20.5 6l-2 1" strokeWidth="2.5" />
              <path d="M3 13c0-5 4-9 9-9s9 4 9 9" strokeWidth="2.5" />
              <path d="M4.5 13v8h15v-8" strokeWidth="2" />
              <path d="M2 21h20" strokeWidth="2.5"/>
              <path d="M12 21v-7" strokeWidth="2"/>
            </svg>
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-name text-white font-bold text-xl tracking-wide">Elite Stays</span>
          </div>
        </Link>

        {/* RIGHT – All Nav Items */}
        <div className="nav-right-container hidden lg:flex items-center gap-6 xl:gap-8 ml-auto">
          
          <NavLink className="user-nav-link" to="/">HOME</NavLink>
          <NavLink className="user-nav-link" to="/hotels">HOTELS</NavLink>

          {/* User Info & Actions */}
          {userInfo ? (
            <div className="flex items-center gap-6 xl:gap-8 border-l border-white/20 pl-6 xl:pl-8">
              {/* Profile Greeting */}
              <div className="user-profile-badge">
                <div className="user-avatar-circle">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <span className="user-greeting">HI, {userInfo.name.split(' ')[0].toUpperCase()}</span>
              </div>

              {/* Active Notification Bell */}
              <NotificationBell />

              <NavLink 
                className="user-nav-link" 
                to={userInfo.role === 'admin' ? '/admin/dashboard' : userInfo.role === 'manager' ? '/manager/dashboard' : '/dashboard'}
              >
                DASHBOARD
              </NavLink>
              <NavLink className="user-nav-link" to="/wishlist">WISHLIST</NavLink>
              <button className="user-nav-link logout-btn uppercase" onClick={handleLogout}>LOGOUT</button>
            </div>
          ) : (
            <div className="flex items-center gap-6 xl:gap-8 border-l border-white/20 pl-6 xl:pl-8">
               <NavLink className="user-nav-link" to="/login">LOGIN</NavLink>
               <NavLink 
                 to="/signup"
                 className="nav-register-btn group"
               >
                 <span className="relative z-10 flex items-center gap-2">
                   REGISTER
                   <svg className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                 </span>
                 <div className="btn-glow-effect"></div>
               </NavLink>
            </div>
          )}
        </div>
        
        {/* Mobile hamburger */}
        <button className="glass-hamburger lg:hidden ml-auto" type="button" data-bs-toggle="collapse" data-bs-target="#userNavMobile">
          <span className="bg-white"></span><span className="bg-white"></span><span className="bg-white"></span>
        </button>
      </div>

      {/* Mobile collapse */}
      <div className="collapse" id="userNavMobile">
        <div className="user-mobile-menu">
          <NavLink className="user-nav-link" to="/">HOME</NavLink>
          <NavLink className="user-nav-link" to="/hotels">HOTELS</NavLink>
          {userInfo ? (
            <>
              <NavLink 
                className="user-nav-link" 
                to={userInfo.role === 'admin' ? '/admin/dashboard' : userInfo.role === 'manager' ? '/manager/dashboard' : '/dashboard'}
                onClick={() => document.getElementById('userNavMobile').classList.remove('show')}
              >
                DASHBOARD
              </NavLink>
              <NavLink className="user-nav-link" to="/wishlist">WISHLIST</NavLink>
              <button className="user-nav-link logout-btn text-left" onClick={handleLogout}>LOGOUT</button>
            </>
          ) : (
            <>
              <NavLink className="user-nav-link" to="/login">LOGIN</NavLink>
              <NavLink className="user-nav-link" to="/signup">REGISTER</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
