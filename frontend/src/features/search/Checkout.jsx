import React, { useState, useEffect } from 'react';

const Checkout = ({ bookingID }) => {
  const [booking, setBooking] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Updated to use a safer way to access environment variables in this environment
  const url = (typeof process !== 'undefined' && process.env?.VITE_API_URL) 
              || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
              || '';

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await fetch(`${url}/api/bookings/${bookingID}/checkout`);
        if (!res.ok) throw new Error("Could not load booking data");
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (bookingID) loadBooking();
  }, [bookingID, url]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${paddedMinutes} ${ampm}`;
  };

  const handleFinalPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${url}/api/bookings/${bookingID}/confirm`, {
        method: 'PATCH'
      });
      if (res.ok) {
        window.location.href = '';
      } else {
        throw new Error("Payment failed.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    window.location.href = '';
  };

  if (loading) return <div style={styles.center}>Loading Checkout...</div>;
  if (!booking) return <div style={styles.center}>Booking not found.</div>;

  // Calculate Subtotal for a specific flight leg
  const getFlightSubtotal = (flight) => {
    return flight.tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  };

  // Grand total calculations
  const totalSubtotal = booking.flights.reduce((sum, f) => sum + getFlightSubtotal(f), 0);
  const taxRate = 0.13566;
  const taxAmount = totalSubtotal * taxRate;
  const grandTotal = totalSubtotal + taxAmount;

  return (
    <div style={styles.container}>
      <button onClick={handleBack} style={styles.backLink}>← Back</button>
      <div style={styles.layout}>
        <div style={styles.main}>
          <h2 style={styles.sectionTitle}>Review & Checkout</h2>
          <p style={styles.bookingRef}>
            Booking: <strong>#B{Math.floor(bookingID / 2 + 3) % 10}{bookingID}{Math.floor((bookingID / 2 + 3) / 10)}</strong>
          </p>
          
          {booking.flights.map((flight, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.legLabel}>{idx === 0 ? 'Outbound' : 'Return'} Flight</span>
                <span style={styles.flightNum}>Flight {flight.flightNumber}</span>
              </div>
              
              <div style={styles.routeRow}>
                <div>
                  <div style={styles.city}>{flight.departure.city} ({flight.departure.iata})</div>
                  <div style={styles.time}>{formatTime(flight.departure.time)}</div>
                </div>
                <div style={styles.arrow}>→</div>
                <div>
                  <div style={styles.city}>{flight.arrival.city} ({flight.arrival.iata})</div>
                  <div style={styles.time}>{formatTime(flight.arrival.time)}</div>
                </div>
              </div>

              <div style={styles.passengerGrid}>
                {flight.tickets.map(t => (
                  <div key={t.ticketId} style={styles.pTag}>
                    <div style={styles.pInfo}>
                      <span>{t.passenger}</span>
                      <span style={styles.pSeat}>Seat {t.seatLabel}</span>
                      <span style={styles.pPrice}>${(t.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Price Summary</h3>
          
          <div style={styles.priceBreakdown}>
            {booking.flights.map((flight, idx) => (
              <div key={idx} style={styles.priceRow}>
                <span>Flight {flight.flightNumber} ({flight.departure.iata}–{flight.arrival.iata}):</span>
                <span style={styles.boldPrice}>${getFlightSubtotal(flight).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          <div style={styles.priceRow}>
            <span>Taxes, Fees, & Charges:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          
          <div style={styles.totalRow}>
            <span>Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          
          <button onClick={handleFinalPayment} disabled={isProcessing} style={styles.payBtn}>
            {isProcessing ? 'Processing...' : `Pay $${grandTotal.toFixed(2)}`}
          </button>

          <p style={styles.secureText}>By clicking "Pay", you agree to our <strong>Terms & Conditions</strong>, <strong>Privacy Policy</strong>, and <strong>Contract of Carriage</strong>.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {

  container: { maxWidth: '1100px', margin: '0 auto', padding: '40px' },
  layout: { display: 'flex', gap: '40px' },
  main: { flex: 2 },
  sidebar: { flex: 1, backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' },
  sectionTitle: { fontSize: '1.8rem', marginBottom: '10px' },
  card: { border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '20px', backgroundColor: '#fff' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  legLabel: { fontWeight: 'bold', color: '#007bff', textTransform: 'uppercase', fontSize: '0.8rem' },
  flightNum: { color: '#666', fontSize: '0.9rem' },
  routeRow: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  city: { fontSize: '1.2rem', fontWeight: 'bold' },
  time: { fontSize: '0.9rem', color: '#666' },
  arrow: { fontSize: '1.5rem', color: '#ccc' },
  passengerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' },
  pTag: { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' },
  pInfo: { display: 'flex', flexDirection: 'column' },
  pSeat: { color: '#2d3748', fontWeight: '600', fontSize: '0.9rem' },
  pPrice: { color: '#718096', fontSize: '0.85rem' },
  priceRow: { display: 'flex', justifyContent: 'space-between', margin: '15px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' },
  payBtn: { width: '100%', padding: '15px', backgroundColor: '#e01933', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' },
  center: { textAlign: 'center', marginTop: '100px', fontSize: '1.2rem' },
  secureText: { textAlign: 'center', fontSize: '0.75rem', color: '#a0aec0', marginTop: '10px' },
  backLink: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0, marginBottom: '15px', display: 'block' }
};

export default Checkout;