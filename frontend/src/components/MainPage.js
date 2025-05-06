import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import '../App.css';

const MainPage = () => {
  return (
    <div className="main-page">
      <Navbar />
      <div className="main-content">
        <div className="main-actions">
          <Link to="/availability" className="action-button">Wskaż dostępne terminy</Link>
        </div>
        <h2>Dostępne sale</h2>
        <div className="room-grid">
          <div className="room-card">
            <h3>Aula A</h3>
            <p>Pojemność: 100 osób</p>
            <button>Zarezerwuj</button>
          </div>
          <div className="room-card">
            <h3>Sala komputerowa B</h3>
            <p>Pojemność: 30 osób</p>
            <button>Zarezerwuj</button>
          </div>
          <div className="room-card">
            <h3>Sala konferencyjna C</h3>
            <p>Pojemność: 15 osób</p>
            <button>Zarezerwuj</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage; 