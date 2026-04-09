import React, { useState } from 'react';
import SeatSelection from './SeatSelection'; // We will create this next

const FlightSearch = ({ userID }) => {
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [passengersNumber, setPassengersNumber] = useState(1);
  
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State to track the flight currently being booked
  const [selectedFlight, setSelectedFlight] = useState(null);

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
        departureDate,
        passengersNumber,
      }).toString();

      const url = import.meta.env.VITE_API_URL;
      const response = await fetch(`${url}/api/flights/search?${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch flights');
      }
      const filteredData = data
        .filter(flight => flight.status.name !== 'Cancelled' && flight.status.name !== 'Departed'); // Filter out cancelled and departed flights

      setFlights(filteredData);
    } catch (err) {
      setError(err.message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString([], { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const formatDuration = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours === 0 ? `${minutes}m` : minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  };

  // If a flight is selected, show the Seat Selection screen instead
  if (selectedFlight) {
    return (
      <SeatSelection 
        flight={selectedFlight} 
        passengersNumber={passengersNumber} 
        userID={userID}
        onBack={() => setSelectedFlight(null)} 
      />
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Search Flights</h1>
      
      {/* Search Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px', padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '8px'
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
          <label style={{ fontWeight: 'bold' }}>Departure Date</label>
          <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} style={{ padding: '8px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>Passengers</label>
          <select value={passengersNumber} onChange={(e) => setPassengersNumber(e.target.value)} style={{ padding: '8px' }}>
            {[...Array(9)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleSearch} 
          disabled={loading}
          style={{ 
            alignSelf: 'flex-end', height: '40px', cursor: 'pointer', backgroundColor: '#007bff', 
            color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold'
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
              <tr style={{ backgroundColor: '#333', color: 'white' }}>
                <th style={{ padding: '12px' }}>Flight</th>
                <th style={{ padding: '12px' }}>Route</th>
                <th style={{ padding: '12px' }}>Departure</th>
                <th style={{ padding: '12px' }}>Arrival</th>
                <th style={{ padding: '12px' }}>Duration</th>
                <th style={{ padding: '12px' }}> </th>
              </tr>
            </thead>
            <tbody>
              {flights
                .map((flight) => (
                <tr key={flight.flightInstanceId} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{flight.flightNumber}</td>
                  <td style={{ padding: '12px' }}>{flight.departure.city} ({flight.departure.iata}) → {flight.arrival.city} ({flight.arrival.iata})</td>
                  <td style={{ padding: '12px' }}>{formatDateTime(flight.departure.time)}</td>
                  <td style={{ padding: '12px' }}>{formatDateTime(flight.arrival.time)}</td>
                  {/* Duration */}
                  <td style={{ padding: '12px' }}>
                    <div>{formatDuration(flight.durationMinutes)}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => setSelectedFlight(flight)}
                      style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Book
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p style={{ textAlign: 'center', color: '#666' }}>No flights found.</p>
        )}
      </div>
    </div>
  );
};

export default FlightSearch;