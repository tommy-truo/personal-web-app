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
      // Note: encodeURIComponent is safer for cities with spaces (e.g., "San Francisco")
      const query = new URLSearchParams({
        departureCity,
        arrivalCity,
        departureDate
      }).toString();

      const url = `http://localhost:5001`;
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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Search Flights</h1>
      
      {/* Search Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        padding: '20px',
        backgroundColor: '#f4f4f4',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>From</label>
          <input type="text" value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder="e.g. Houston" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>To</label>
          <input type="text" value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} placeholder="e.g. Los Angeles" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>Date</label>
          <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
        </div>

        <button 
          onClick={handleSearch} 
          disabled={loading}
          style={{ height: '40px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Searching...' : 'Find Flights'}
        </button>
      </div>

      {/* Results Section */}
      <div style={{ marginTop: '30px' }}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {flights.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Flight</th>
                <th style={{ padding: '10px' }}>Route</th>
                <th style={{ padding: '10px' }}>Departure Time</th>
                <th style={{ padding: '10px' }}>Duration</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.flightInstanceId} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{flight.flightNumber}</td>
                  <td style={{ padding: '10px' }}>
                    <strong>{flight.departure.city}</strong> ({flight.departure.airportName}) 
                    → 
                    <strong>{flight.arrival.city}</strong> ({flight.arrival.airportName})
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Date(flight.departure.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '10px' }}>{flight.durationMinutes} mins</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      backgroundColor: flight.status.name === 'Delayed' ? '#fff3cd' : '#d4edda',
                      color: flight.status.name === 'Delayed' ? '#856404' : '#155724'
                    }}>
                      {flight.status.name}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p>No flights found for this criteria.</p>
        )}
      </div>
    </div>
  );
};

export default FlightSearch;