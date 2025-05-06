import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">UniRezerwacja</div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Strona główna</Link>
        <Link to="/login" className="nav-link">Logowanie</Link>
      </div>
    </nav>
  );
};

export default Navbar; 