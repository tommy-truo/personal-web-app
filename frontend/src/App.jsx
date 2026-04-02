import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';  
import Signup from './components/SignUp.jsx';
import PassengerDashboard from './components/Layout.jsx';
// IMPORT YALLS SPECIFIC COMPONENTS HERE

const App = () => {
  // Initialize view from localStorage so the user stays logged in on refresh
  const [view, setView] = useState(localStorage.getItem('activeView') || 'login');
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userID'));

  // Function to handle successful passenger signup
  const handlePassengerSignupSuccess = (userData) => {
    console.log("Passenger signed up:", userData.user.id);
    localStorage.setItem('userID', userData.user.id);
    setCurrentUserId(userData.user.id); // Store user ID in state

    // Redirect to passenger dashboard after signup
    localStorage.setItem('activeView', 'passengerDashboard');
    setView('passengerDashboard');
  };
  
  // Function to handle successful login
  const handleLoginSuccess = (userData) => {
    // Store user details (like ID) in localStorage here if needed
    console.log("User logged in:", userData.user.id);
    localStorage.setItem('userID', userData.user.id);
    setCurrentUserId(userData.user.id); // Store user ID in state

    // ROLE-BASED REDIRECTION
    if (userData.user.role == 'passenger') { // FOR PASSENGER ACCOUNTS
      localStorage.setItem('activeView', 'passengerDashboard');
      setView('passengerDashboard');
    }
    // ADD 'else if' FOR OTHER ROLES BELOW
  };

  const handleLogout = () => {
    setView('login');
    setCurrentUserId(null);
    localStorage.removeItem('activeView');
    localStorage.removeItem('userID');
  };

  // SPECIFY YOUR COMPONENTS AND THEIR VIEW NAME BELOW, FOLLOWING THE EXAMPLE OF LOGIN, SIGNUP, PASSENGER DASHBOARD
  return (
    <div className="app-container">
      {/* 1. Login View */}
      {view === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onSwitch={() => {
            setView('passengerSignup');
            localStorage.setItem('activeView', 'passengerSignup');
          }} 
        />
      )}

      {/* 2. Passenger Signup View */}
      {view === 'passengerSignup' && (
        <Signup 
          onSignupSuccess={handlePassengerSignupSuccess}
          onSwitch={() => {
            setView('login');
            localStorage.setItem('activeView', 'login');
          }} 
        />
      )}

      {/* 3. Passenger View (The Passenger Profile) */}
      {view === 'passengerDashboard' && (
        <PassengerDashboard userID={currentUserId} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;