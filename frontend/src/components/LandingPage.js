import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import '../App.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <div className="hero-section">
        <h1>Witaj w UniRezerwacja</h1>
        <p>Twoje kompleksowe rozwiązanie do rezerwacji sal i pomieszczeń na uczelni</p>
        <Link to="/main" className="cta-button">Rozpocznij</Link>
      </div>
    </div>
  );
};

export default LandingPage; 