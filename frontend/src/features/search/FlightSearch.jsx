import React, { useState, useEffect } from 'react';
import BookingSummary from './BookingSummary';

const calculateCost = (distance, totalMinutes, multiplier = 1) => {
  const timeFactor = 1 + (230 / (totalMinutes + 78));
  const base = ((distance * 0.621371) / 5.56) * timeFactor * 0.6; // Base cost with time factor
  return Math.floor(base * multiplier);
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

  const formatDateLabel = (dateString) => {
  return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

  const formatDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours === 0 ? `${minutes}m` : minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

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

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async (isReturnSearch = false) => {
    const from = isReturnSearch ? arrivalCity : departureCity;
    const to = isReturnSearch ? departureCity : arrivalCity;
    const date = isReturnSearch ? returnDate : departureDate;
    setLoading(true);
    setFlights([]);
    setError(null);

    if (!from || !to || !date || (tripType === 'round-trip' && !returnDate)) {
      alert("Please enter all required fields.");
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
      setFlights(data.filter(f => f.status.name !== 'Cancelled' && f.status.name !== 'Departed'));
    } catch (err) {
      setError(err.message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlight = (flight, cabinClass, estimatedPrice) => {
    const flightWithDetails = { 
      ...flight,
      selectedClass: cabinClass,
      basePrice: estimatedPrice
    };

    const updatedSelection = [...selectedFlights, flightWithDetails];
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{isSelectingReturn ? 'Select Return Flight' : 'Search Flights'}</h1>
        {selectedFlights.length > 0 && (
          <button onClick={handleBack} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', color: '#007bff' }}>← Back to Search</button>
        )}
      </div>
      
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
              <input 
                style={styles.input} 
                type="date" 
                value={departureDate} 
                required 
                min={today} // Prevents dates before today
                onChange={(e) => {
                  setDepartureDate(e.target.value);
                  // Logic: If return date is now before the new departure date, reset it
                  if (returnDate && e.target.value > returnDate) {
                    setReturnDate('');
                  }
                }} 
              />
            </div>
            {tripType === 'round-trip' && (
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>
                  Return Date
                  <span style={styles.required}>*</span>
                  </label>
                <input 
                  style={styles.input} 
                  type="date" 
                  value={returnDate} 
                  min={departureDate || today} // Return date can't be before departure date
                  onChange={(e) => setReturnDate(e.target.value)}
                />
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

      {/* DELTA-STYLE RESULTS */}
      <div style={{ marginTop: '30px' }}>
        {flights.length > 0 ? (
          <div>
            {flights.map(f => {
              const economyPrice = calculateCost(f.distanceKm, f.durationMinutes);
              const firstClassPrice = Math.floor(economyPrice * 3.5);

              return (
                <div key={f.flightInstanceId} style={styles.flightCard}>
                  {/* LEFT SIDE: Flight Info */}
                  <div style={styles.flightInfoSection}>
                    <div style={styles.timeRow}>
                      <div style={styles.timeBlock}>
                        <div style={styles.timeText}>{formatDateTime(f.departure.time)}</div>
                        <div style={styles.dateText}>{formatDateLabel(f.departure.time)}</div>
                        <div style={styles.iataText}>{f.departure.city} ({f.departure.iata})</div>
                      </div>
                      <div style={styles.durationLine}>
                        <span style={styles.durationLabel}>{formatDuration(f.durationMinutes)}</span>
                        <hr style={styles.line} />
                        <span style={styles.nonstopText}>Nonstop</span>
                      </div>
                      <div style={styles.timeBlock}>
                        <div style={styles.timeText}>{formatDateTime(f.arrival.time)}</div>
                        <div style={styles.dateText}>{formatDateLabel(f.arrival.time)}</div>
                        <div style={styles.iataText}>{f.arrival.city} ({f.arrival.iata})</div>
                      </div>
                    </div>
                    <div style={styles.subDetailText}>
                        {f.flightNumber}
                    </div>
                  </div>

                  {/* RIGHT SIDE: Price Tiles */}
                  <div style={styles.priceSection}>
                    <div style={styles.priceTile} onClick={() => handleSelectFlight(f, 'Economy', economyPrice)}>
                      <div style={styles.classLabel}>Economy</div>
                      <div style={styles.priceValue}>${economyPrice}</div>
                    </div>
                    <div style={{...styles.priceTile, borderLeft: '1px solid #ddd'}} onClick={() => handleSelectFlight(f, 'First Class', firstClassPrice)}>
                      <div style={styles.classLabel}>First Class</div>
                      <div style={styles.priceValue}>${firstClassPrice}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>No flights found. Try adjusting your search.</p>}
      </div>
    </div>
  );
};

const styles = {
  searchContainer: { display: 'flex', gap: '15px', padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '8px', marginBottom: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '1rem' },
  searchBtn: { padding: '10px 20px', backgroundColor: '#e01933', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  required: { color: '#e01933', marginLeft: '4px' },
  
  flightCard: { 
    display: 'flex', 
    border: '1px solid #ccc', 
    borderRadius: '4px', 
    marginBottom: '15px', 
    overflow: 'hidden',
    backgroundColor: '#fff'
  },
  flightInfoSection: { flex: 2, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  timeRow: { display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '10px' },
  timeBlock: { textAlign: 'center' },
  timeText: { fontSize: '1.4rem', fontWeight: 'bold' },
  dateText: { fontSize: '0.875rem', fontWeight: 'bold'},
  iataText: { fontSize: '1.0rem', color: '#666', fontWeight: 'bold' },
  
  durationLine: { flex: 1, textAlign: 'center', position: 'relative' },
  durationLabel: { fontSize: '0.8rem', color: '#666', fontWeight: 'bold' },
  line: { border: '0', borderTop: '1px solid #999', margin: '5px 0' },
  nonstopText: { fontSize: '0.75rem', color: '#28a745', fontWeight: 'bold' },
  subDetailText: { fontSize: '0.85rem', color: '#666' },

  priceSection: { flex: 1, display: 'flex', backgroundColor: '#f9f9f9' },
  priceTile: { 
    flex: 1, 
    padding: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  classLabel: { fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px', color: '#444' },
  priceValue: { fontSize: '1.25rem', fontWeight: 'bold', color: '#003366' }
};

export default FlightSearch;