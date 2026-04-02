import React, { useState } from 'react';
import '../App.css';
import FlightSearch from '../features/search/FlightSearch';
import Profile from '../features/profile/Profile';
import MyBookings from '../features/bookings/MyBookings';

const PassengerDashboard = ({userID, onLogout}) => {
  const [activeTab, setActiveTab] = useState('search');

  const handleSignOut = () => {
    // Logic for signing out (e.g., clearing tokens)
    console.log("Signing out...");
    onLogout();
  };

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="dashboard-container">
      <nav className="sidebar">
        <h2 style={{ marginBottom: '30px' }}>ACME Airlines</h2>
        
        {/* Navigation Links */}
        <div className="nav-links">
          <button 
            className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search Flights
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            My Bookings
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile & Guests
          </button>
        </div>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          <button className="signout-button" onClick={handleSignOut}>
            Log Out
          </button>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'search' && <FlightSearch userID={userID} />}
        {activeTab === 'bookings' && (<MyBookings userID={userID} onNavigate={handleNavigate} />)}
        {activeTab === 'profile' && <Profile userID={userID} />}
      </main>
    </div>
  );
};

export default PassengerDashboard;