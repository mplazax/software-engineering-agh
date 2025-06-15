import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

const PublicRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);

  // W komponencie nadrzędnym (AppRoutes) jest już obsługa stanu 'loading'
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
