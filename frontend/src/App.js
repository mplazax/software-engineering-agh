import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import MainPage from './components/MainPage';
import AvailabilitySchedule from './components/AvailabilitySchedule';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/availability" element={<AvailabilitySchedule />} />
      </Routes>
    </Router>
  );
}

export default App;
