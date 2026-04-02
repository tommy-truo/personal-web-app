import React, { useState, useEffect } from 'react';

const url = import.meta.env.VITE_API_URL; // Base URL for API calls

const MyBookings = ({ userID, onNavigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);

  // 1. Fetch all bookings for the passenger owner
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${url}/api/bookings/passenger/${userID}`);
        
        if (!response.ok) throw new Error('Failed to fetch bookings');

        const data = await response.json();
        setBookings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

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
      const response = await fetch(`${url}/api/bookings/tickets/${ticketID}/check-in`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setBookings(prevBookings => prevBookings.map(b => {
          if (b.id === bookingID) {
            return {
              ...b,
              tickets: b.tickets.map(t => t.id === ticketID ? { ...t, checkedIn: true } : t)
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
        setBookings(prevBookings => prevBookings.map(b => {
          if (b.id === bookingID) {
            const updatedTickets = b.tickets.filter(t => t.id !== ticketID);
            return { ...b, tickets: updatedTickets };
          }
          return b;
        }).filter(b => b.tickets.length > 0)); 
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
        <h1>My Bookings</h1>
      </header>

      <div style={styles.list}>
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} style={styles.card}>
              <div style={styles.bookingRow}>
                <div style={{ flex: 2 }}>
                  <span style={styles.idLabel}>BOOKING #{booking.id} • {booking.flight.number}</span>
                  <div style={styles.routeRow}>
                    <h3>{booking.departure.departureCity}{", "}{booking.departure.departureCountry}</h3>
                    <span style={{ color: '#3182ce' }}>➔</span>
                    <h3>{booking.arrival.arrivalCity}{", "}{booking.arrival.arrivalCountry}</h3>
                  </div>
                  {/*Airport Info*/}
                  <div>
                    <div style={{fontSize: 14}}>{booking.departure.departureAirport} ➔ {booking.arrival.arrivalAirport}</div>
                  </div>
                  <p style={styles.dateText}>
                    {new Date(booking.departure.scheduledDeparture).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} ➔ {new Date(booking.arrival.scheduledArrival).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                <div style={styles.statusCol}>
                  <div style={{ ...styles.badge, ...getStatusStyle(booking.status) }}>
                    {booking.status}
                  </div>
                </div>

                <div style={styles.actionsCol}>
                  <button 
                    onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                    style={styles.primaryBtn}
                  >
                    {expandedBooking === booking.id ? 'Hide Details' : 'Manage Tickets'}
                  </button>
                  <button onClick={() => handleCancelBooking(booking.id)} style={styles.cancelLink}>
                    Cancel Booking
                  </button>
                </div>
              </div>

              {expandedBooking === booking.id && (
                <div style={styles.ticketSection}>
                  <h4 style={styles.ticketHeading}>Passengers & Boarding</h4>
                  {booking.tickets.map(ticket => (
                    <div key={ticket.id} style={styles.ticketRow}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {/* Dynamic Middle Initial Logic */}
                          {ticket.passenger.firstName} {ticket.passenger.middleInitial ? `${ticket.passenger.middleInitial} ` : ''}{ticket.passenger.lastName}
                        </div>
                        <div style={styles.ticketSubtext}>
                          Seat {ticket.seat.row}{ticket.seat.col} • {ticket.boardingGroup}
                        </div>
                        <div style={styles.ticketSubtext}>
                          Ticket #{ticket.id}
                        </div>
                      </div>

                      <div style={styles.ticketActions}>
                        {ticket.checkedIn === false ? (
                          <button onClick={() => handleTicketCheckIn(booking.id, ticket.id)} style={styles.checkInBtn}>
                            Check In
                          </button>
                        ) : (
                          <span style={styles.checkedInLabel}>✓ Checked In</span>
                        )}
                        <button 
                          onClick={() => handleTicketDelete(booking.id, ticket.id)}
                          style={styles.removeBtn}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={styles.centerMsg}>No upcoming trips found.</div>
        )}
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

// --- Styles & Helpers ---

const getStatusStyle = (status) => {
  if (status === 'Confirmed') return { backgroundColor: '#c6f6d5', color: '#22543d' };
  return { backgroundColor: '#feebc8', color: '#744210' };
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: '30px', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' },
  centerMsg: { textAlign: 'center', padding: '100px', fontSize: '1.2rem', color: '#718096' },
  list: { display: 'grid', gap: '20px' },
  card: { border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  bookingRow: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  idLabel: { fontSize: '0.7rem', fontWeight: 'bold', color: '#a0aec0', letterSpacing: '0.05em' },
  routeRow: { display: 'flex', alignItems: 'center', gap: '14px', margin: '8px 0' },
  dateText: { margin: 0, color: '#4a5568', fontSize: '18px' },
  statusCol: { flex: 1, textAlign: 'center', minWidth: '120px' },
  badge: { display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
  actionsCol: { flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' },
  primaryBtn: { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  cancelLink: { background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' },
  ticketSection: { backgroundColor: '#f8fafc', padding: '20px', borderTop: '1px solid #e2e8f0' },
  ticketHeading: { margin: '0 0 15px 0', fontSize: '0.85rem', color: '#718096', textTransform: 'uppercase' },
  ticketRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'white', marginBottom: '10px', borderRadius: '8px', border: '1px solid #edf2f7' },
  ticketSubtext: { color: '#718096', fontSize: '0.8rem', marginTop: '2px' },
  ticketActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  checkInBtn: { backgroundColor: '#48bb78', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  checkedInLabel: { color: '#48bb78', fontWeight: 'bold', fontSize: '0.8rem' },
  removeBtn: { background: 'none', border: '1px solid #feb2b2', color: '#c53030', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  
  // Footer Specific Styles
  footerAction: { marginTop: '40px', textAlign: 'center', padding: '30px', borderTop: '1px dashed #e2e8f0' },
  bookTripBtn: { display: 'inline-block', backgroundColor: '#3182ce', color: 'white', border: 'none', cursor: 'pointer',textDecoration: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(49, 130, 206, 0.3)' }
};

export default MyBookings;