import React, { useState } from 'react';

const FlightSearch = ({ userID }) => {
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!departureCity || !arrivalCity || !departureDate) {
      alert("Please enter departure city, arrival city, and departure date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        departureCity,
        arrivalCity,
        departureDate
      }).toString();

      const url = import.meta.env.VITE_API_URL;
      const response = await fetch(`${url}/api/flights/search?${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch flights');
      }

      setFlights(data);
    } catch (err) {
      setError(err.message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format dates consistently
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Search Flights</h1>
      
      {/* Search Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        padding: '20px',
        backgroundColor: '#f4f4f4',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>From</label>
          <input type="text" value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder="e.g. Houston" style={{ padding: '8px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>To</label>
          <input type="text" value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} placeholder="e.g. Los Angeles" style={{ padding: '8px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>Date</label>
          <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} style={{ padding: '8px' }} />
        </div>

        <button 
          onClick={handleSearch} 
          disabled={loading}
          style={{ 
            alignSelf: 'flex-end',
            height: '40px', 
            cursor: 'pointer', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Searching...' : 'Find Flights'}
        </button>
      </div>

      {/* Results Section */}
      <div style={{ marginTop: '30px', overflowX: 'auto' }}>
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        
        {flights.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Flight</th>
                <th style={{ padding: '12px' }}>Route Details (Origin → Destination)</th>
                <th style={{ padding: '12px' }}>Departure</th>
                <th style={{ padding: '12px' }}>Arrival</th>
                <th style={{ padding: '12px' }}>Dist / Dur</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.flightInstanceId} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{flight.flightNumber}</td>
                  
                  {/* Comprehensive Route Details */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>{flight.departure.city}, {flight.departure.country}</strong> 
                      <span style={{ color: '#666', fontSize: '0.9em' }}> ({flight.departure.airportName})</span>
                    </div>
                    <div style={{ color: '#007bff', fontWeight: 'bold' }}>↓</div>
                    <div>
                      <strong>{flight.arrival.city}, {flight.arrival.country}</strong> 
                      <span style={{ color: '#666', fontSize: '0.9em' }}> ({flight.arrival.airportName})</span>
                    </div>
                  </td>

                  {/* Dates and Times */}
                  <td style={{ padding: '12px' }}>{formatDateTime(flight.departure.time)}</td>
                  <td style={{ padding: '12px' }}>{formatDateTime(flight.arrival.time)}</td>
                  
                  {/* Distance and Duration */}
                  <td style={{ padding: '12px' }}>
                    <div>{flight.estimatedDistanceKm} km</div>
                    <div style={{ color: '#666', fontSize: '0.85em' }}>{flight.durationMinutes} mins</div>
                  </td>

                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      fontWeight: 'bold',
                      backgroundColor: flight.status.name === 'Delayed' ? '#fff3cd' : '#d4edda',
                      color: flight.status.name === 'Delayed' ? '#856404' : '#155724'
                    }}>
                      {flight.status.name}
                    </span>
                    {flight.status.reason && (
                      <div style={{ fontSize: '0.75em', marginTop: '4px', color: '#dc3545' }}>
                        {flight.status.reason}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && !error && <p style={{ textAlign: 'center', color: '#666' }}>No flights found. Try a different search.</p>
        )}
      </div>
    </div>
  );
};

export default FlightSearch;