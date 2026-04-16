import React, { useState, useEffect } from 'react';

const MyBookings = ({ userID, onNavigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);

  const limitCheckInDate = true;

  const url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${url}/api/bookings/passenger/${userID}`)
      .then(res => res.json())
      .then(data => {
        const now = new Date();

        // Filter and Process Bookings
        const filteredAndProcessed = data
          .filter(booking => {
            // 1. Identify the latest flight by arrival time
            if (!booking.flights || booking.flights.length === 0) return false;
            
            // We sort or simply find the maximum arrival time among all flights in this booking
            const latestArrival = Math.max(
              ...booking.flights.map(f => new Date(f.arrival.time).getTime())
            );

            // 2. Only keep bookings where the latest arrival is in the future
            return latestArrival >= now.getTime();
          });

        setBookings(filteredAndProcessed);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError("Could not load bookings.");
      });
  }, [userID]);

  // 2. Handle Full Booking Cancellation
  const handleCancelBooking = async (bookingID) => {
    if (!window.confirm("Are you sure you want to cancel this entire booking? All seats will be released.")) return;
    
    try {
      const response = await fetch(`${url}/api/bookings/${bookingID}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setBookings(prev => prev.filter(b => Number(b.id) !== Number(bookingID)));
      }
    } catch (err) {
      alert("Failed to cancel booking");
    }
  };

  // 3. Handle Individual Ticket Check-in
  const handleTicketCheckIn = async (bookingID, ticketID) => {
    try {
      const booking = bookings.find(b => b.id === bookingID);
      const flight = booking?.flights.find(f => f.tickets.some(t => t.id === ticketID));
      if (limitCheckInDate === true && flight) {
        const departureDate = new Date(flight.departure.time);
        const now = new Date();
        const diffInHours = (departureDate - now) / (1000 * 60 * 60);

        // check flight departure date and only allow ticket check in up to 24 hours before departure if limitCheckInDate is true
        if (diffInHours > 24) {
          alert("Check-in is only available up to 24 hours before flight departure.");
          return;
        }
      }
      
      const response = await fetch(`${url}/api/bookings/tickets/${ticketID}/check-in`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setBookings(prevBookings => prevBookings.map(b => {
          if (b.id === bookingID) {
            return {
              ...b,
              flights: b.flights.map(f => ({
                ...f,
                tickets: f.tickets.map(t => t.id === ticketID ? { ...t, checkedIn: true } : t)
              }))
            };
          }
          return b;
        }));
      }
    } catch (err) {
      alert("Check-in failed.");
    }
  };

  // 4. Handle Individual Ticket Deletion
  const handleTicketDelete = async (bookingID, ticketID) => {
    if (!window.confirm("Cancel this ticket? This cannot be undone.")) return;

    try {
      const response = await fetch(`${url}/api/bookings/tickets/${ticketID}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBookings(prevBookings => {
          return prevBookings.map(b => {
            if (b.id === bookingID) {
              // Update the tickets inside each flight leg specifically
              const updatedFlights = b.flights.map(f => ({
                ...f,
                tickets: f.tickets.filter(t => t.id !== ticketID)
              })).filter(f => f.tickets.length > 0); 

              return { ...b, flights: updatedFlights };
            }
            return b;
          }).filter(b => b.flights && b.flights.length > 0); 
        });
      }
    } catch (err) {
      alert("Failed to remove ticket.");
    }
  };

  if (loading) return <div style={styles.centerMsg}>Loading your trips...</div>;
  if (error) return <div style={{ ...styles.centerMsg, color: 'red' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ color: '#2d3748' }}>My Trips</h1>
      </header>

      <div style={styles.list}>
        {bookings.map((booking) => (
          <div key={booking.id} style={styles.card}>
            {/* Header: Booking ID and Global Status */}
            <div style={styles.cardHeader}>
              <span style={styles.idLabel}>BOOKING #B{Math.floor(booking.id/2 + 3)%10}{booking.id}{Math.floor((booking.id/2 + 3)/10)}</span>
              <div style={{ ...styles.badge, ...getStatusStyle(booking.status) }}>
                {booking.status}
              </div>
            </div>

            {/* Itinerary Summary (The "Round Trip" view) */}
            <div style={styles.itinerarySummary}>
              {booking.flights.map((f, idx) => (
                <div key={f.instanceId} style={styles.flightLeg}>
                  <div style={styles.legBadge}>{idx === 0 ? 'OUTBOUND' : 'RETURN'}</div>
                  <div style={styles.legMain}>
                    <div style={styles.routeText}>
                      {f.departure.city} ({f.departure.iata}) ➔ {f.arrival.city} ({f.arrival.iata})
                    </div>
                    <div style={{...styles.dateSubtext, fontWeight: 'bold'}}>
                      {new Date(f.departure.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ➔ {new Date(f.arrival.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={styles.flightNum}>Flight {f.number}</div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div style={styles.cardFooter}>
              <button 
                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                style={styles.detailsBtn}
              >
                {expandedBooking === booking.id ? 'Close Details' : 'View Details'}
              </button>
              <button style={styles.cancelLink} onClick={() => {handleCancelBooking(booking.id)}}>
                Cancel Booking
              </button>
            </div>

            {/* Expanded Content: Tickets per Flight */}
            {expandedBooking === booking.id && (
              <div style={styles.expandedContent}>
                {booking.flights.map(f => (
                  <div key={f.instanceId} style={styles.flightDetailSection}>
                    <h4 style={styles.sectionHeading}>Tickets for Flight {f.number}</h4>
                    {f.tickets.map(t => (
                      <div key={t.id} style={styles.ticketRow}>
                        <div style={styles.ticketInfo}>
                          <div style={{fontWeight: 'bold'}}>{t.passenger}</div>
                          <div style={styles.sub}>Seat {t.seat} • {t.boardingGroup}</div>
                        </div>
                        <div style={styles.ticketActions}>
                          {t.checkedIn ? (
                            <span style={styles.checkedLabel}>✓ Checked In</span>
                          ) : (
                            <button style={styles.checkInBtn} onClick={() => handleTicketCheckIn(booking.id, t.id)}>Check In</button>
                          )}
                          <button 
                            style={styles.cancelTicketLink} 
                            onClick={() => handleTicketDelete(booking.id, t.id)}
                            >
                            Cancel Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER ACTION: BOOK NEW TRIP */}
            <div style={styles.footerAction}>
              <p style={{ color: '#718096', marginBottom: '15px' }}>Ready for your next adventure?</p>
              <button 
                onClick={() => onNavigate('search')} 
                style={styles.bookTripBtn}
              >
                + Book a New Trip
              </button>
            </div>
    </div>
  );
};

const getStatusStyle = (status) => {
  if (status === 'Confirmed') return { backgroundColor: '#e6fffa', color: '#2c7a7b' };
  if (status === 'Pending') return { backgroundColor: '#fffaf0', color: '#9c4221' };
  return { backgroundColor: '#fff5f5', color: '#c53030' };
};

const styles = {
  centerMsg: { textAlign: 'center', padding: '50px' },
  container: { maxWidth: '850px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, sans-serif' },
  header: { marginBottom: '30px' },
  list: { display: 'flex', flexDirection: 'column', gap: '25px' },
  card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' },
  cardHeader: { padding: '15px 20px', borderBottom: '1px solid #f7fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfcfc' },
  idLabel: { fontSize: '0.75rem', fontWeight: 'bold', color: '#718096', letterSpacing: '0.05em' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' },
  itinerarySummary: { padding: '20px' },
  flightLeg: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  legBadge: { fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 'bold', backgroundColor: '#ebf4ff', color: '#3182ce', padding: '3px 8px', borderRadius: '4px', width: '80px', textAlign: 'center' },
  legMain: { flex: 1 },
  routeText: { fontWeight: '700', fontSize: '1.05rem' },
  dateSubtext: { fontSize: '0.85rem', color: '#718096' },
  flightNum: { fontSize: '0.85rem', color: '#a0aec0', fontWeight: '500' },
  cardFooter: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f7fafc' },
  detailsBtn: { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  cancelLink: { background: 'none', border: 'none', color: '#e53e3e', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' },
  expandedContent: { backgroundColor: '#f8fafc', padding: '20px' },
  flightDetailSection: { marginBottom: '20px' },
  sectionHeading: { fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase', marginBottom: '10px' },
  ticketRow: { backgroundColor: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px', border: '1px solid #edf2f7' },
  sub: { fontSize: '0.8rem', color: '#718096' },
  checkInBtn: { backgroundColor: '#48bb78', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' },
  cancelTicketLink: { background: 'none', border: 'none', color: '#e53e3e', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' },
  checkedLabel: { color: '#48bb78', fontWeight: 'bold', fontSize: '0.85rem' },
  footerAction: { marginTop: '40px', textAlign: 'center', padding: '30px', borderTop: '1px dashed #e2e8f0' },
  bookTripBtn: { display: 'inline-block', backgroundColor: '#3182ce', color: 'white', border: 'none', cursor: 'pointer',textDecoration: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(49, 130, 206, 0.3)' }
};

export default MyBookings;