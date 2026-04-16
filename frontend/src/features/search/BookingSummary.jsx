import React, { useState, useMemo, useEffect } from 'react';
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

  const isPassengersDone = assignedPassengers.length === parseInt(passengersNumber);
  const isSeatsDone = Object.keys(bookingData).length === selectedFlights.length;

  const checkoutButtonText = isProcessing ? "Proceeding to Checkout..." : "Confirm Details & Checkout";

  const url = import.meta.env.VITE_API_URL;

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
    
    // 1. Flatten the bookingData for the API
    // bookingData looks like: { flightId: { seatId: { passengerObj } } }
    const tickets = [];
    
    Object.keys(bookingData).forEach(flightId => {
      const flightSeats = bookingData[flightId];
      Object.keys(flightSeats).forEach(seatId => {
        const passenger = flightSeats[seatId];
        tickets.push({
          flightInstanceID: parseInt(flightId),
          seatID: parseInt(seatId),
          passengerID: passenger.passengerId,
          price: passenger.seatPrice // We stored this in SeatSelection!
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
        setBookingID(data.bookingID); // Store the ID
        setIsCheckout(true);          // Trigger view change
      }
    } catch (err) {
      alert(err.message);
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
                        Flight {f.flightNumber}
                    </div>
                    <div style={styles.flightSub}>
                      {formatDateTime(f.departure.time)} → {formatDateTime(f.arrival.time)}
                    </div>
                    <div style={styles.classSelectionSub}>
                      Cabin Class Preference: 
                      <div style={{ fontWeight: 'bold' }}>{f.selectedClass ? f.selectedClass : 'Not Selected'}</div>
                    </div>
                </div>
              </div>
            ))}
          </div>  
        </div>

        {/* 1. PASSENGER DROPDOWN */}
        <div style={styles.accordionItem}>
          <div style={styles.accordionHeader} onClick={() => setActiveTab('passengers')}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepTitle}>Passenger Information</span>
              {isPassengersDone && <span style={styles.checkMark}>✓</span>}
          </div>
          {activeTab === 'passengers' && (
              <div style={styles.accordionContent}>
              <PassengerSelection 
                  userID={userID}
                  requiredCount={passengersNumber}
                  onConfirm={(passengers) => {
                    setAssignedPassengers(passengers);
                    setBookingData({}); 
                    setActiveTab('seats'); 
                  }}
                  onBack={onBack} 
              />
              </div>
          )}
        </div>

        {/* 2. SEAT SELECTION DROPDOWN */}
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
  pageLayout: { display: 'flex', gap: '40px', padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fff' },
  workflowColumn: { flex: 2 },
  itineraryHeader: { marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' },
  // Changed from grid to a flex column for vertical stacking
  itineraryStack: { display: 'flex', flexDirection: 'column', gap: '12px' },
  itineraryCard: { 
    padding: '18px', 
    border: '1px solid #eee', 
    borderRadius: '10px', 
    backgroundColor: '#fcfcfc',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  legBadge: { 
    fontSize: '0.7rem', 
    textTransform: 'uppercase', 
    fontWeight: 'bold', 
    color: '#007bff', 
    backgroundColor: '#e7f3ff',
    padding: '4px 8px',
    borderRadius: '4px',
    minWidth: '70px',
    textAlign: 'center'
  },
  flightInfoContainer: { flex: 1 },
  flightMain: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px' },
  flightArrow: { margin: '0 12px', color: '#999', fontWeight: 'normal' },
  flightSub: { fontSize: '0.85rem', color: '#666' },
  classSelectionSub: { fontSize: '0.9rem', marginTop: '6px' },
  
  priceSidebar: { flex: 1, backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '12px', height: 'fit-content', border: '1px solid #eee', position: 'sticky', top: '20px' },
  accordionItem: { border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden', backgroundColor: 'white' },
  accordionHeader: { padding: '18px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: '#fff' },
  accordionContent: { padding: '20px', borderTop: '1px solid #eee' },
  stepNumber: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', fontSize: '0.9rem', fontWeight: 'bold' },
  stepTitle: { fontWeight: 'bold', fontSize: '1.1rem', flex: 1 },
  checkMark: { color: '#28a745', fontWeight: 'bold', fontSize: '1.2rem' },
  
  flightRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  selectBtn: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  editBtn: { backgroundColor: '#e6fffa', color: '#2c7a7b', border: '1px solid #2c7a7b', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
  finalBookBtn: { width: '100%', padding: '18px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '20px', transition: 'background-color 0.2s ease' },
  
  priceRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  hr: { border: '0', borderTop: '1px solid #ddd', margin: '20px 0' },
  guaranteeBox: { marginTop: '20px', padding: '12px', border: '1px dashed #ccc', borderRadius: '6px' },
  backLink: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0, marginBottom: '15px', display: 'block' }
};

export default BookingSummary;