import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import RoomsPage from "./pages/RoomsPage";
import UsersPage from "./pages/UsersPage";
import GroupsPage from "./pages/GroupsPage";
import CoursesPage from "./pages/CoursesPage";
import ProposalsPage from "./pages/ProposalsPage";
import ChangeRequestsPage from "./pages/ChangeRequestsPage";
import { isAuthenticated } from "./services/authService";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/main"
          element={isAuthenticated() ? <MainPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/rooms"
          element={isAuthenticated() ? <RoomsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={isAuthenticated() ? <UsersPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/groups"
          element={isAuthenticated() ? <GroupsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses"
          element={isAuthenticated() ? <CoursesPage /> : <Navigate to="/login" />}
        />
        <Route
            path="/proposals"
            element={isAuthenticated() ? <ProposalsPage /> : <Navigate to="/login" />}
        />
        <Route
            path="/requests"
            element={isAuthenticated() ? <ChangeRequestsPage /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;