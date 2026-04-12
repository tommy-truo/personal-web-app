import React, { useState, useMemo } from 'react';
import PassengerSelection from './PassengerSelection';
import SeatSelection from './SeatSelection';

const BookingSummary = ({ selectedFlights, passengersNumber, userID, onBack }) => {
  const [activeTab, setActiveTab] = useState('passengers'); 
  const [assignedPassengers, setAssignedPassengers] = useState([]);
  const [bookingData, setBookingData] = useState({}); 
  const [activeFlightForSeats, setActiveFlightForSeats] = useState(null);

  const priceDetails = useMemo(() => {
    const basePrice = selectedFlights.length * 250; 
    const taxes = basePrice * 0.15;
    const total = (basePrice + taxes) * passengersNumber;
    return { basePrice, taxes, total };
  }, [selectedFlights, passengersNumber]);

  const isPassengersDone = assignedPassengers.length === parseInt(passengersNumber);
  const isSeatsDone = Object.keys(bookingData).length === selectedFlights.length;

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
        onBack={() => setActiveFlightForSeats(null)}
        onSeatsConfirmed={(selections) => {
          setBookingData(prev => ({ ...prev, [activeFlightForSeats.flightInstanceId]: selections }));
          setActiveFlightForSeats(null);
        }}
      />
    );
  }

  return (
    <div style={styles.pageLayout}>
      <div style={styles.workflowColumn}>
        <button onClick={onBack} style={styles.backLink}>← Back to Flights</button>
        
        <div style={styles.itineraryHeader}>
          <h2 style={{ margin: '0 0 15px 0' }}>Booking Summary</h2>

          {/* Stacked Layout Container */}
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
                // Check if passengers actually changed to avoid unnecessary resets
                setAssignedPassengers(passengers);
                
                // CRITICAL: Clear existing seat selections because the 
                // mapping of "who sits where" is now invalid.
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
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                Please select seats for all passengers on each flight.
              </p>
              {selectedFlights.map(flight => {
                const hasSeats = !!bookingData[flight.flightInstanceId];
                return (
                  <div key={flight.flightInstanceId} style={styles.flightRow}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{flight.departure.iata} → {flight.arrival.iata}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Flight {flight.flightNumber}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{formatDateTime(flight.departure.time)} → {formatDateTime(flight.arrival.time)}</div>
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
          <button style={styles.finalBookBtn} onClick={() => alert("Redirecting to Secure Payment...")}>
            Proceed to Payment
          </button>
        )}
      </div>

      <div style={styles.priceSidebar}>
        <h3 style={{ marginTop: 0 }}>Price Details</h3>
        <hr style={styles.hr} />
        <div style={styles.priceRow}>
          <span>Base Fare (x{passengersNumber})</span>
          <span>${(priceDetails.basePrice * passengersNumber).toFixed(2)}</span>
        </div>
        <div style={styles.priceRow}>
          <span>Taxes & Fees</span>
          <span>${(priceDetails.taxes * passengersNumber).toFixed(2)}</span>
        </div>
        <hr style={styles.hr} />
        <div style={{ ...styles.priceRow, fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>
          <span>Total</span>
          <span>${priceDetails.total.toFixed(2)}</span>
        </div>
        <div style={styles.guaranteeBox}>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>
            Prices include all government taxes and carrier fees. No hidden booking charges.
          </span>
        </div>
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
  finalBookBtn: { width: '100%', padding: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '20px' },
  
  priceRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  hr: { border: '0', borderTop: '1px solid #ddd', margin: '20px 0' },
  guaranteeBox: { marginTop: '20px', padding: '12px', border: '1px dashed #ccc', borderRadius: '6px' },
  backLink: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0, marginBottom: '15px', display: 'block' }
};

export default BookingSummary;