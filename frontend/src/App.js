import React, { createContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import RoomsPage from "./pages/RoomsPage";
import UsersPage from "./pages/UsersPage";
import GroupsPage from "./pages/GroupsPage";
import CoursesPage from "./pages/CoursesPage";
import ProposalsPage from "./pages/ProposalsPage";
import ChangeRequestsPage from "./pages/ChangeRequestsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import RedirectOnRoot from "./pages/RedirectOnRoot";
import { isAuthenticated, getCurrentUser } from "./services/authService";

export const UserContext = createContext(null);
export const ErrorContext = createContext(null);

const App = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      getCurrentUser()
        .then((data) => setUser(data))
        .catch(() => setUser(null));
    }
  }, []);

  const handleCloseError = () => setError("");

  return (
    <ErrorContext.Provider value={setError}>
      <UserContext.Provider value={user}>
        <Router>
          <Box sx={{ paddingTop: 8 }}>
            <Routes>
              <Route path="/" element={<RedirectOnRoot />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/main" element={<MainPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/requests" element={<ChangeRequestsPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
            </Routes>
          </Box>
        </Router>
        <Dialog open={!!error} onClose={handleCloseError}>
          <DialogTitle>Błąd autoryzacji</DialogTitle>
          <DialogContent>{error}</DialogContent>
          <DialogActions>
            <Button onClick={handleCloseError} variant="contained">
              Zamknij
            </Button>
          </DialogActions>
        </Dialog>
      </UserContext.Provider>
    </ErrorContext.Provider>
  );
};

export default App;