import React, { useState, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';

const Checkout = ({ bookingID, onBack = null }) => {
  const [booking, setBooking] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payWithMiles, setPayWithMiles] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardData, setCardData] = useState({ name: '', number: '', expiry: '', cvv: '', zip: '' });

  const url = import.meta.env.VITE_API_URL;

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
    return date.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Grand total calculations
  const getFlightSubtotal = (flight) => flight.tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalSubtotal = booking?.flights.reduce((sum, f) => sum + getFlightSubtotal(f), 0) || 0;
  const taxRate = 0.13566;
  const taxAmount = totalSubtotal * taxRate;
  const grandTotal = totalSubtotal + taxAmount;

  const totalInMiles = Math.ceil(grandTotal * 10 );
  const canAffordWithMiles = booking?.loyalty?.miles >= totalInMiles;

  const handlePayButtonClick = () => {
    if (payWithMiles) {
      handleFinalPayment(); // Direct pay for miles
    } else {
      setShowCardModal(true); // Show popup for credit card
    }
  };

  const handleFinalPayment = async (e) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setShowCardModal(false); // Close modal if open
    try {
      // 1. Create the Transaction record first
      const transactionData = {
        bookingID,
        paymentMethod: payWithMiles ? "Miles" : "Credit",
        transactionType: payWithMiles ? "Miles Redemption" : "Payment",
        amount: payWithMiles ? totalInMiles : grandTotal.toFixed(2)
      };

      const transRes = await fetch(`${url}/api/bookings/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      if (!transRes.ok) throw new Error("Transaction record failed.");

      // 2. Confirm the Booking (PATCH)
      const confirmRes = await fetch(`${url}/api/bookings/${bookingID}/confirm`, {
        method: 'PATCH'
      });

      if (confirmRes.ok) {
        if (booking.loyalty.isMember && !payWithMiles) {
          alert(`You just earned ${Math.ceil(grandTotal * 2)} Miles!`);
        }
        window.location.href = '/';
      } else {
        throw new Error("Final confirmation failed.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimeout = async () => {
    // 1. Prevent multiple executions if the user clicks while it's processing
    if (isProcessing) return; 
    
    setLoading(true);
    setIsProcessing(true);

    try {
      // 2. Call the backend to update the booking status to 'Expired' or 'Cancelled'
      const res = await fetch(`${url}/api/bookings/${bookingID}/expire`, {
        method: 'PATCH', // Usually a PATCH or PUT for status updates
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        // Log the error but continue to redirect the user
        console.warn("Backend failed to expire booking, but session is over.");
      }
      
      // 3. User Feedback
      alert("The 15-minute booking window has expired. Your seat reservations have been released.");

    } catch (err) {
      console.error("Network error during expiration:", err);
    } finally {
      setLoading(false);
      // 4. Force redirect to search or home
      window.location.href = '/'; 
    }
  };

  if (loading) return <div style={styles.center}>Loading Checkout...</div>;
  if (!booking) return <div style={styles.center}>Booking not found.</div>;

  return (
    <div style={styles.container}>

      {/* Presentation Modal */}
      {showCardModal && (
        <div style={styles.modalOverlay}>
          <form style={styles.modalContent} onSubmit={handleFinalPayment}>
            <h3>Credit Card Details</h3>
            
            <input required style={styles.input} type="text" placeholder="Cardholder Name" onChange={e => setCardData({...cardData, name: e.target.value})} />
            <input required style={styles.input} type="text" placeholder="Card Number (0000 0000 0000 0000)" maxLength="16" />
            <div style={{display: 'flex', gap: '10px'}}>
              <input required style={styles.input} type="text" placeholder="MM/YY" maxLength="5" />
              <input required style={styles.input} type="text" placeholder="CVV" maxLength="3" />
            </div>
            <input required style={styles.input} type="text" placeholder="Billing Address" />
            
            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <button type="button" onClick={() => setShowCardModal(false)} style={{...styles.payBtn, backgroundColor: '#ccc'}}>Cancel</button>
              <button type="submit" style={styles.payBtn}>Pay ${grandTotal.toFixed(2)}</button>
            </div>
          </form>
        </div>
      )}

      <button onClick={() => onBack ? onBack() : window.location.href = ''} style={styles.backLink}>← Back</button>
      
      <div style={styles.layout}>
        <div style={styles.main}>
          <h2 style={styles.sectionTitle}>Review & Checkout</h2>
          <p style={styles.bookingRef}>
            Booking: <strong>#B{Math.floor(bookingID / 2 + 3) % 10}{bookingID}{Math.floor((bookingID / 2 + 3) / 10)}</strong>
          </p>

          <div style={styles.timerWrapper}>
            <CountdownTimer 
              expiryTimestamp={booking.expires.replace(' ', 'T')} 
              onExpire={handleTimeout} 
            />
          </div>
          
          {booking.flights.map((flight, idx) => (
            <div key={idx} style={styles.card}>
               <div style={styles.cardHeader}>
                <span style={styles.legLabel}>{idx === 0 ? 'Outbound' : 'Return'}</span>
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
          {booking.loyalty.isMember && (
            <div style={styles.loyaltyBox}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1a365d' }}>Loyalty Member Portal</h4>
              <p style={styles.mileBalance}>
                Current Balance: <strong>{booking.loyalty.miles.toLocaleString()} Miles</strong>
              </p>
              
              <div style={styles.checkboxContainer}>
                <input 
                  type="checkbox" 
                  id="milePay" 
                  checked={payWithMiles}
                  disabled={!canAffordWithMiles}
                  onChange={(e) => setPayWithMiles(e.target.checked)}
                  style={{ cursor: canAffordWithMiles ? 'pointer' : 'not-allowed', accentColor: '#3182ce'  }}
                />
                <label htmlFor="milePay" style={{ 
                  marginLeft: '10px', 
                  fontSize: '0.9rem', 
                  cursor: canAffordWithMiles ? 'pointer' : 'not-allowed',
                  color: canAffordWithMiles ? '#2d3748' : '#a0aec0'
                }}>
                  Pay using Loyalty Miles
                </label>
              </div>
              {!canAffordWithMiles && (
                <p style={styles.errorText}>
                  You need {(totalInMiles - booking.loyalty.miles).toLocaleString()} more miles to use this option.
                </p>
              )}
            </div>
          )}

          <h3 style={styles.sidebarTitle}>Price Summary</h3>
          
          <div style={styles.priceRow}>
            <span>{}Subtotal:</span>
            <span>${totalSubtotal.toFixed(2)}</span>
          </div>
          <div style={styles.priceRow}>
            <span>Taxes, Fees, & Charges:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>

          <div style={styles.divider} />

          {/* Main Total Display */}
          <div style={styles.totalRow}>
            <span>Total:</span>
            <span style={{ color: payWithMiles ? '#2c7a7b' : '#2d3748' }}>
              {payWithMiles ? `${totalInMiles.toLocaleString()} miles` : `$${grandTotal.toFixed(2)}`}
            </span>
          </div>

          {/* Secondary Miles Display (Always visible for members) */}
          {booking.loyalty.isMember && (
            <div style={styles.milesSecondaryRow}>
              <span>Price in Miles:</span>
              <span>{totalInMiles.toLocaleString()} Miles</span>
            </div>
          )}

          <button 
            onClick={handlePayButtonClick} 
            disabled={isProcessing} 
            style={{
              ...styles.payBtn,
              backgroundColor: payWithMiles ? '#28a745' : '#e01933'
            }}
          >
            {isProcessing ? 'Processing...' : payWithMiles ? 'Redeem Miles' : 'Confirm & Pay'}
          </button>

          {booking.loyalty.isMember && (
            <p style={styles.secureText}>
              {payWithMiles
                ? "Miles will be deducted from your account immediately upon confirmation." 
                : `You could earn ${Math.ceil(grandTotal * 2).toLocaleString()} Miles with this purchase.`
              }
            </p>
          )}
          <p style={styles.secureText}>
            By clicking 'Confirm & Pay', you agree to our Terms & Conditions, Privacy Policy, and Contract of Carriage.
          </p>
          <p style={styles.secureText}>
            Taxes and fees are nonrefundable.
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
  secureText: { textAlign: 'center', fontSize: '1.0rem', color: '#a0aec0', marginTop: '10px' },
  backLink: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0, marginBottom: '15px', display: 'block' },
  loyaltyBox: { backgroundColor: '#eef6ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cce3ff' },
  divider: { borderTop: '1px solid #ddd', margin: '15px 0' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' },
  timerWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px', // Adds space between the timer and the first flight card
    width: '100%'
  },
  input: { 
    padding: '12px', 
    borderRadius: '6px', 
    border: '1px solid #ddd', 
    fontSize: '1rem',
    width: '100%',        // Ensures it fills the container
    boxSizing: 'border-box' // Prevents padding from adding to the width
  },
  milesSecondaryRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    fontSize: '0.95rem', 
    color: '#718096', 
    marginTop: '4px',
    fontStyle: 'italic'
  },
  secureText: { 
    textAlign: 'center', 
    fontSize: '0.7rem', 
    color: '#a0aec0', 
    marginTop: '15px',
    lineHeight: '1.4'
  },
};

export default Checkout;