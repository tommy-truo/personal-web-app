import React, { useState } from 'react';

const Checkout = ({ selectedFlights, assignedPassengers, bookingData, userID, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const url = import.meta.env.VITE_API_URL;

    const flightTotals = selectedFlights.map(flight => {
        const seatsForThisFlight = Object.values(bookingData[flight.flightInstanceId] || {});
        
        // Calculate total by summing individual seat prices
        const subtotal = seatsForThisFlight.reduce((sum, p) => sum + (p.seatPrice), 0);
        
        // Group seats by class for the summary display
        const classBreakdown = seatsForThisFlight.reduce((acc, p) => {
            acc[p.seatClass] = (acc[p.seatClass] || 0) + 1;
            return acc;
        }, {});

        return {
            ...flight,
            subtotal,
            classBreakdown,
            seats: seatsForThisFlight
        };
    });

    const rawSubtotal = flightTotals.reduce((sum, f) => sum + f.subtotal, 0);
    const taxAmount = rawSubtotal * 0.13566;
    const grandTotal = rawSubtotal + taxAmount;

  const handleFinalBooking = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        userId: userID,
        flights: selectedFlights.map(f => ({
          flightInstanceId: f.flightInstanceId,
          seats: bookingData[f.flightInstanceId] 
        })),
        subtotal: rawSubtotal,
        taxAmount: taxAmount.toFixed(2),
        totalPrice: grandTotal.toFixed(2) // Sending as string to preserve precision
      };

      const res = await fetch(`${url}/api/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Booking Successful!");
        window.location.href = '/my-trips';
      } else {
        throw new Error("Payment failed.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>← Back to Summary</button>
      
      <div style={styles.layout}>
        <div style={styles.main}>
          <h2 style={styles.sectionTitle}>Review Your Trip</h2>
          
          {flightTotals.map((flight, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.legLabel}>{idx === 0 ? 'Outbound' : 'Return'} Flight</span>
                <span style={styles.flightNum}>{flight.flightNumber}</span>
              </div>
              
              <div style={styles.routeRow}>
                <div>
                  <div style={styles.city}>{flight.departure.city} ({flight.departure.iata})</div>
                  <div style={styles.time}>{new Date(flight.departure.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={styles.arrow}>→</div>
                <div>
                  <div style={styles.city}>{flight.arrival.city} ({flight.arrival.iata})</div>
                  <div style={styles.time}>{new Date(flight.arrival.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div style={styles.passengerGrid}>
                {assignedPassengers.map(p => {
                  const seatEntry = Object.entries(bookingData[flight.flightInstanceId] || {})
                    .find(([id, pass]) => pass.passengerId === p.passengerId);

                  const seatData = seatEntry ? seatEntry[1] : null;
                  
                  return (
                    <div key={p.passengerId} style={styles.pTag}>
                      <span style={styles.pName}>{p.firstName} {p.lastName}</span>
                      <span style={styles.pSeat}>Seat: {seatData ? seatData.seatLabel : 'Not Assigned'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar: Price Summary */}
        <div style={styles.sidebar}>
            <h3>Price Summary</h3>
            {flightTotals.map((f, i) => (
                <div key={i} style={styles.priceRow}>
                <span>{f.flightNumber} Subtotal:</span>
                <span>${f.subtotal.toFixed(2)}</span>
                </div>
            ))}
            <div style={styles.priceRow}>
                <span>Taxes, Fees, & Charges:</span>
                <span>${taxAmount.toFixed(2)}</span>
            </div>
            <hr />
            <div style={styles.totalRow}>
                <span>Total </span>
                <span>${grandTotal.toFixed(2)}</span>
            </div>
            <button 
                onClick={handleFinalBooking} 
                disabled={isProcessing}
                style={styles.payBtn}
            >
                {isProcessing ? 'Processing...' : `Pay $${grandTotal.toFixed(2)}`}
            </button>
            
            <p style={styles.disclaimer}>
                By clicking "Pay", you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '40px' },
  layout: { display: 'flex', gap: '40px' },
  main: { flex: 2 },
  sidebar: { flex: 1, backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '12px', height: 'fit-content', border: '1px solid #ddd' },
  sectionTitle: { fontSize: '1.8rem', marginBottom: '20px' },
  card: { border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  legLabel: { fontWeight: 'bold', color: '#007bff', textTransform: 'uppercase', fontSize: '0.8rem' },
  flightNum: { color: '#666', fontSize: '0.9rem' },
  routeRow: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  city: { fontSize: '1.2rem', fontWeight: 'bold' },
  time: { fontSize: '0.9rem', color: '#666' },
  arrow: { fontSize: '1.5rem', color: '#ccc' },
  passengerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' },
  pTag: { fontSize: '0.9rem', display: 'flex', flexDirection: 'column' },
  pName: { fontWeight: '500' },
  pSeat: { color: '#28a745', fontSize: '0.8rem' },
  priceRow: { display: 'flex', justifyContent: 'space-between', margin: '15px 0' },
  hr: { border: 0, borderTop: '1px solid #ddd', margin: '15px 0' },
  payBtn: { width: '100%', padding: '15px', backgroundColor: '#e01933', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' },
  disclaimer: { fontSize: '0.75rem', color: '#888', textAlign: 'center', marginTop: '15px' },
  backBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginBottom: '20px' }
};

export default Checkout;