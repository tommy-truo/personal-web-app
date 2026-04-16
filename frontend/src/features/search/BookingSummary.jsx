import React, { useState, useEffect } from 'react';
import PassengerSelection from './PassengerSelection';
import SeatSelection from './SeatSelection';
import Checkout from './Checkout';

const BookingSummary = ({ selectedFlights, passengersNumber, userID, onBack }) => {
  const [activeTab, setActiveTab] = useState('passengers'); 
  const [assignedPassengers, setAssignedPassengers] = useState([]);
  const [bookingData, setBookingData] = useState({}); 
  const [activeFlightForSeats, setActiveFlightForSeats] = useState(null);
  const [isCheckout, setIsCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingID, setBookingID] = useState(null);
  const [allOccupiedIds, setAllOccupiedIds] = useState([]);

  const url = import.meta.env.VITE_API_URL;

  // 1. Fetch occupied passengers for ALL selected flights
  useEffect(() => {
    const fetchAllOccupied = async () => {
      try {
        const promises = selectedFlights.map(f => 
          fetch(`${url}/api/passengers/flights/${f.flightInstanceId}`).then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        // Flatten all arrays and extract unique IDs
        const flatIds = results.flat().map(p => p.passenger_id || p.passengerId);
        setAllOccupiedIds([...new Set(flatIds)]);
      } catch (err) {
        console.error("Error fetching occupied passengers for itinerary:", err);
      }
    };

    if (selectedFlights.length > 0) {
      fetchAllOccupied();
    }
  }, [selectedFlights, url]);

  const isPassengersDone = assignedPassengers.length === parseInt(passengersNumber);
  const isSeatsDone = Object.keys(bookingData).length === selectedFlights.length;
  const checkoutButtonText = isProcessing ? "Proceeding to Checkout..." : "Confirm Details & Checkout";

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString([], { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (activeFlightForSeats) {
    return (
      <SeatSelection 
        flight={activeFlightForSeats}
        passengers={assignedPassengers}
        initialSeats={bookingData[activeFlightForSeats.flightInstanceId] || {}}
        onBack={() => setActiveFlightForSeats(null)}
        onSeatsConfirmed={(selections) => {
          setBookingData(prev => ({ ...prev, [activeFlightForSeats.flightInstanceId]: selections }));
          setActiveFlightForSeats(null);
        }}
      />
    );
  }
  
  const handleBeginCheckout = async () => {
    setIsProcessing(true);
    const tickets = [];
    
    Object.keys(bookingData).forEach(flightId => {
      const flightSeats = bookingData[flightId];
      Object.keys(flightSeats).forEach(seatId => {
        const passenger = flightSeats[seatId];
        tickets.push({
          flightInstanceID: parseInt(flightId),
          seatID: parseInt(seatId),
          passengerID: passenger.passengerId,
          price: passenger.seatPrice
        });
      });
    });

    try {
      const response = await fetch(`${url}/api/bookings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerID: userID, tickets })
      });

      if (response.ok) {
        const data = await response.json();
        setBookingID(data.bookingID);
        setIsCheckout(true);
      }
    } catch (err) {
      alert(err.message);
      setIsProcessing(false);
    }
  };

  if (isCheckout) {
    return <Checkout bookingID={bookingID} />;
  }

  return (
    <div style={styles.pageLayout}>
      <div style={styles.workflowColumn}>
        <button onClick={onBack} style={styles.backLink}>← Back to Flights</button>
        
        <div style={styles.itineraryHeader}>
          <h2 style={{ margin: '0 0 15px 0' }}>Booking Summary</h2>
          <div style={styles.itineraryStack}>
            {selectedFlights.map((f, index) => (
              <div key={f.flightInstanceId} style={styles.itineraryCard}>
                <div style={styles.legBadge}>{index === 0 ? 'Outbound' : 'Return'}</div>
                <div style={styles.flightInfoContainer}>
                    <div style={styles.flightMain}>
                        <span style={styles.flightCity}>{f.departure.city} ({f.departure.iata})</span>
                        <span style={styles.flightArrow}>→</span>
                        <span style={styles.flightCity}>{f.arrival.city} ({f.arrival.iata})</span>
                    </div>
                    <div style={styles.flightSub}>
                      Flight {f.flightNumber} • {formatDateTime(f.departure.time)}
                    </div>
                    <div style={styles.classSelectionSub}>
                      Class: <strong>{f.selectedClass || 'Economy'}</strong>
                    </div>
                </div>
              </div>
            ))}
          </div>  
        </div>

        {/* 1. PASSENGER SELECTION */}
        <div style={styles.accordionItem}>
          <div style={styles.accordionHeader} onClick={() => setActiveTab('passengers')}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepTitle}>Passenger Information</span>
              {isPassengersDone && <span style={styles.checkMark}>✓</span>}
          </div>
          {activeTab === 'passengers' && (
              <div style={styles.accordionContent}>
                {/* Note: We pass the pre-fetched global list of occupied IDs here */}
                <PassengerSelection 
                  userID={userID}
                  requiredCount={passengersNumber}
                  occupiedPassengerIds={allOccupiedIds} 
                  onConfirm={(passengers) => {
                    setAssignedPassengers(passengers);
                    setBookingData({}); // Reset seats if passengers change
                    setActiveTab('seats'); 
                  }}
                />
              </div>
          )}
        </div>

        {/* 2. SEAT SELECTION */}
        <div style={{
          ...styles.accordionItem,
          opacity: isPassengersDone ? 1 : 0.5,
          pointerEvents: isPassengersDone ? 'auto' : 'none'
        }}>
          <div style={styles.accordionHeader} onClick={() => isPassengersDone && setActiveTab('seats')}>
            <span style={styles.stepNumber}>2</span>
            <span style={styles.stepTitle}>Seat Selection</span>
            {isSeatsDone && <span style={styles.checkMark}>✓</span>}
          </div>
          {activeTab === 'seats' && isPassengersDone && (
            <div style={styles.accordionContent}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                Please select seats for all passengers on each flight leg.
              </p>
              {selectedFlights.map(flight => {
                const hasSeats = !!bookingData[flight.flightInstanceId];
                return (
                  <div key={flight.flightInstanceId} style={styles.flightRow}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{flight.departure.iata} → {flight.arrival.iata}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Flight {flight.flightNumber}</div>
                    </div>
                    <button 
                      onClick={() => setActiveFlightForSeats(flight)}
                      style={hasSeats ? styles.editBtn : styles.selectBtn}
                    >
                      {hasSeats ? 'Change Seats ✓' : 'Select Seats'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isSeatsDone && isPassengersDone && (
          <button 
            style={{
              ...styles.finalBookBtn,
              backgroundColor: isProcessing ? '#a0aec0' : '#28a745',
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
            onClick={handleBeginCheckout}
            disabled={isProcessing}
          >
            {checkoutButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageLayout: { display: 'flex', gap: '40px', padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
  workflowColumn: { flex: 1 },
  itineraryHeader: { marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' },
  itineraryStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  itineraryCard: { padding: '15px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: '#fcfcfc', display: 'flex', alignItems: 'center', gap: '15px' },
  legBadge: { fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#007bff', backgroundColor: '#e7f3ff', padding: '4px 8px', borderRadius: '4px', minWidth: '65px', textAlign: 'center' },
  flightInfoContainer: { flex: 1 },
  flightMain: { fontSize: '1rem', fontWeight: 'bold' },
  flightArrow: { margin: '0 8px', color: '#999' },
  flightSub: { fontSize: '0.8rem', color: '#666' },
  classSelectionSub: { fontSize: '0.8rem', marginTop: '4px' },
  accordionItem: { border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden', backgroundColor: 'white' },
  accordionHeader: { padding: '18px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  accordionContent: { padding: '20px', borderTop: '1px solid #eee' },
  stepNumber: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', fontSize: '0.9rem', fontWeight: 'bold' },
  stepTitle: { fontWeight: 'bold', fontSize: '1.1rem', flex: 1 },
  checkMark: { color: '#28a745', fontWeight: 'bold', fontSize: '1.2rem' },
  flightRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  selectBtn: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  editBtn: { backgroundColor: '#e6fffa', color: '#2c7a7b', border: '1px solid #2c7a7b', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
  finalBookBtn: { width: '100%', padding: '18px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '20px' },
  backLink: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginBottom: '15px', display: 'block' }
};

export default BookingSummary;