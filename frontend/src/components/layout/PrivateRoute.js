import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import Navbar from "./Navbar";
import { Box } from "@mui/material";

const PrivateRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);

  // W komponencie nadrzędnym (AppRoutes) jest już obsługa stanu 'loading'
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: "64px" }}
      >
        <Outlet />
      </Box>
    </>
  );
};

export default PrivateRoute;
