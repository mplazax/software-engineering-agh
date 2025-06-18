import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";

import PrivateRoute from "./components/layout/PrivateRoute";
import PublicRoute from "./components/layout/PublicRoute";
import { Box, CircularProgress } from "@mui/material";

import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import RoomsPage from "./pages/RoomsPage";
import UsersPage from "./pages/UsersPage";
import GroupsPage from "./pages/GroupsPage";
import CoursesPage from "./pages/CoursesPage";
import EquipmentPage from "./pages/EquipmentPage";
import ChangeRequestsPage from "./pages/ChangeRequestsPage";
import MyRecommendationsPage from "./pages/MyRecommendationsPage";
import RoomUnavailabilityPage from "./pages/RoomUnavailabilityPage";
import EventsPage from "./pages/EventsPage.jsx";

const AppRoutes = () => {
  const { loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* KLUCZOWA POPRAWKA: Wszystkie trasy chronione muszą być tutaj */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/calendar" element={<ChangeRequestsPage />} />
        <Route path="/recommendations" element={<MyRecommendationsPage />} />
          <Route path="/events" element={<EventsPage />} />
        <Route
          path="/room-unavailability"
          element={<RoomUnavailabilityPage />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
