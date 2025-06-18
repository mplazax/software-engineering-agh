import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext.jsx";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Header from "./Header";

const PrivateRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />
        <Box sx={{ flexGrow: 1, p: 3, pt: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default PrivateRoute;
