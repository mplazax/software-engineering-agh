import React from 'react';
import '../App.css';

const LoginForm = () => {
  return (
    <div className="login-container">
      <h2>Logowanie</h2>
      <form className="login-form">
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Hasło" />
        <button type="submit">Zaloguj się</button>
      </form>
      <p>To jest przykładowy formularz logowania. Brak faktycznej implementacji uwierzytelniania.</p>
    </div>
  );
};

export default LoginForm; 