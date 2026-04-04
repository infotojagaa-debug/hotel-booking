import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles, redirectPath = '/login' }) => {
  const { userInfo } = useContext(AuthContext);

  if (!userInfo) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(userInfo.role.toLowerCase())) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
