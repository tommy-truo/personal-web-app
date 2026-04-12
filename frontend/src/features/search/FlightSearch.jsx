import React, { useState, useEffect } from 'react';
import BookingSummary from './BookingSummary';

const FlightSearch = ({ userID }) => {
  const [tripType, setTripType] = useState('one-way');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengersNumber, setPassengersNumber] = useState(1);
  const [flights, setFlights] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const isSelectingReturn = tripType === 'round-trip' && selectedFlights.length === 1;

  const handleSearch = async (isReturnSearch = false) => {
    const from = isReturnSearch ? arrivalCity : departureCity;
    const to = isReturnSearch ? departureCity : arrivalCity;
    const date = isReturnSearch ? returnDate : departureDate;
    setLoading(true);
    setFlights([]);
    setError(null);

    if (!from || !to || !date) {
      alert("Please enter departure city, arrival city, and dates.");
      setLoading(false);
      return;
    }

    try {
      const url = import.meta.env.VITE_API_URL;
      if (tripType === 'round-trip' && !isReturnSearch) {
        const checkQuery = new URLSearchParams({ departureCity: arrivalCity, arrivalCity: departureCity, departureDate: returnDate, passengersNumber }).toString();
        const checkRes = await fetch(`${url}/api/flights/search?${checkQuery}`);
        const checkData = await checkRes.json();
        if (checkData.length === 0) throw new Error(`No return flights available for ${returnDate}.`);
      }

      const query = new URLSearchParams({ departureCity: from, arrivalCity: to, departureDate: date, passengersNumber }).toString();
      const response = await fetch(`${url}/api/flights/search?${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch flights');
      setFlights(data.filter(f => f.status_name !== 'Cancelled' && f.status_name !== 'Departed'));
    } catch (err) {
      setError(err.message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlight = (flight) => {
    const updatedSelection = [...selectedFlights, flight];
    setSelectedFlights(updatedSelection);
    if (tripType === 'round-trip' && updatedSelection.length === 1) {
      handleSearch(true);
    } else {
      setIsConfirmed(true);
    }
  };

  const handleBack = () => {
    const newSelection = [...selectedFlights];
    newSelection.pop();
    setSelectedFlights(newSelection);
    setIsConfirmed(false);
    handleSearch(false);
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

  if (isConfirmed) {
    return (
      <BookingSummary 
        selectedFlights={selectedFlights} 
        passengersNumber={passengersNumber}
        userID={userID}
        onBack={() => {
          setIsConfirmed(false);
          if(tripType === 'one-way') setSelectedFlights([]);
          else setSelectedFlights([selectedFlights[0]]);
        }}
      />
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{isSelectingReturn ? 'Select Return Flight' : 'Search Flights'}</h1>
        {selectedFlights.length > 0 && (
          <button onClick={handleBack} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', color: '#007bff' }}>← Back to Search</button>
        )}
      </div>

      {/* This search block is hidden when isSelectingReturn is true.
        I used a 4-column grid and forced the date row to span all 4 columns.
      */}
      {!isSelectingReturn && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px', 
          padding: '25px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          marginBottom: '30px' 
        }}>
          {/* Row 1: Trip Config & Cities */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              From
              <span style={styles.required}>*</span>
            </label>
            <input style={styles.input} type="text" value={departureCity} required onChange={(e) => setDepartureCity(e.target.value)} placeholder="E.g. Houston" />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              To
              <span style={styles.required}>*</span>
            </label>
            <input style={styles.input} type="text" value={arrivalCity} required onChange={(e) => setArrivalCity(e.target.value)} placeholder="E.g. Los Angeles" />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Passengers</label>
            <select style={styles.input} value={passengersNumber} onChange={(e) => setPassengersNumber(parseInt(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9].map(num => <option key={num} value={num}>{num}</option>)}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Trip Type</label>
            <select style={styles.input} value={tripType} onChange={(e) => { setTripType(e.target.value); setSelectedFlights([]); }}>
              <option value="one-way">One-Way</option>
              <option value="round-trip">Round Trip</option>
            </select>
          </div>

          {/* Row 2: Dates (Forced to new line via grid-column) */}
          <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: '20px' }}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>
                Departure Date
                <span style={styles.required}>*</span>
              </label>
              <input style={styles.input} type="date" value={departureDate} required onChange={(e) => setDepartureDate(e.target.value)} />
            </div>
            {tripType === 'round-trip' && (
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>
                  Return Date
                  <span style={styles.required}>*</span>
                  </label>
                <input style={styles.input} type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
            )}
          </div>

          {/* Search Button Container */}
          <div style={{ gridColumn: '4', display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => handleSearch(false)} style={styles.searchBtn}>
              {loading ? 'Searching...' : 'Find Flights'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ marginTop: '30px', overflowX: 'auto' }}>
        {/* {error && <p style={{ color: '#dc3545', fontWeight: 'bold' }}>{error}</p>} */}
        {flights.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
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
              {flights.map(f => (
                <tr key={f.flightInstanceId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>{f.flightNumber}</td>
                  <td style={{ padding: '12px' }}>{f.departure.city} ({f.departure.iata}) → {f.arrival.city} ({f.arrival.iata})</td>
                  <td style={{ padding: '12px' }}>{formatDateTime(f.departure.time)}</td>
                  <td style={{ padding: '12px' }}>{formatDateTime(f.arrival.time)}</td>
                  <td style={{ padding: '12px' }}>{formatDuration(f.durationMinutes)}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => handleSelectFlight(f)} style={styles.selectBtn}>Select</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !loading && <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>No flights found. Try adjusting your search.</p>}
      </div>
    </div>
  );
};

const styles = {
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.9rem', fontWeight: '600', color: '#495057' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '1rem' },
  searchBtn: { width: '100%', height: '42px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  selectBtn: { backgroundColor: '#28a745', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  required: { color: '#dc3545', marginLeft: '4px' }
};

export default FlightSearch;