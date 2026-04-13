import React, { useState, useEffect } from 'react';

const SeatSelection = ({ flight, passengers, initialSeats, onBack, onSeatsConfirmed }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seatAssignments, setSeatAssignments] = useState(initialSeats || {});

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const url = import.meta.env.VITE_API_URL;
        const response = await fetch(`${url}/api/flights/${flight.flightInstanceId}/seats`);
        const data = await response.json();
        setSeats(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchSeats();
  }, [flight.flightInstanceId]);

  const handleSeatClick = (seat, seatPrice) => {
    if (!seat.isAvailable) return;
    
    if (seatAssignments[seat.id]) {
      const next = { ...seatAssignments };
      delete next[seat.id];
      setSeatAssignments(next);
      return;
    }
    
    const assignedIds = Object.values(seatAssignments).map(p => p.passengerId);
    const nextP = passengers.find(p => !assignedIds.includes(p.passengerId));
    
    // Store the seat details alongside the passenger
    if (nextP) {
      setSeatAssignments({ 
        ...seatAssignments, 
        [seat.id]: { 
          ...nextP, 
          seatPrice: seatPrice, // Store the actual price of this seat
          seatClass: seat.class,
          seatLabel: `${seat.row}${seat.col}`
        } 
      });
    }
  };

  const groupedSeats = seats.reduce((acc, seat) => {
    const cn = seat.class || 'Economy';
    if (!acc[cn]) acc[cn] = [];
    acc[cn].push(seat);
    return acc;
  }, {});

  const renderCabin = (cn, cSeats) => {
    const rows = [...new Set(cSeats.map(s => s.row))].sort((a,b) => a-b);
    const cols = [...new Set(cSeats.map(s => s.col))].sort();

    const aisle = Math.floor(cols.length / 2);
    cols.splice(aisle, 0, 'aisle');

    return (
      <div key={cn} style={{ marginBottom: '30px' }}>
        <h3>{cn}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 50px)`, gap: '10px', justifyContent: 'center' }}>
          {rows.map(r => (
            <React.Fragment key={r}>
              {cols.map((c, idx) => {
                const s = cSeats.find(st => st.row === r && st.col === c);
                if (!s) return <div key={`${r}-${c}`} />;
                if (c === 'aisle') return <div key={`${r}-aisle`} style={{ width: '25px' }} />;
                
                const mine = !!seatAssignments[s.id];

                // figure out what the expected price is
                // figure out what the class's price is
                let classPrice = flight.basePrice;
                if (flight.selectedClass === 'Economy') {
                  if (s.class === 'First Class') classPrice = Math.floor(flight.basePrice * 3.5);
                } else if (flight.selectedClass === 'First Class') {
                  if (s.class === 'Economy') classPrice = Math.floor(flight.basePrice / 3.5);
                }

                const priceDiff = classPrice - flight.basePrice;
                const priceLabel = priceDiff > 0 ? `+$${priceDiff}` : priceDiff < 0 ? `-$${Math.abs(priceDiff)}` : '+$0';

                return (
                  <div 
                    key={s.id} 
                    onClick={() => handleSeatClick(s, classPrice)} 
                    style={{
                      width: '50px', 
                      height: '60px', 
                      border: mine ? '2px solid #1a73e8' : '1px solid #ccc', // Explicit border
                      cursor: s.isAvailable ? 'pointer' : 'not-allowed',
                      backgroundColor: !s.isAvailable ? '#d3d3d3' : mine ? '#28a745' : '#fff', // Green when selected
                      color: mine ? 'white' : 'black', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '6px', 
                      fontSize: '0.75rem',
                      transition: 'all 0.2s ease',
                      boxShadow: mine ? '0 2px 8px rgba(40, 167, 69, 0.4)' : 'none'
                    }}
                  >
                    <b style={{ fontSize: '0.9rem' }}>{s.row}{s.col}</b>
                    
                    {mine ? (
                      <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>
                        {seatAssignments[s.id].firstName.substring(0,6)}
                      </span>
                    ) : (
                      s.isAvailable && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold',
                          color: priceDiff > 0 ? '#28a745' : priceDiff < 0 ? '#d9534f' : '#888' 
                        }}>
                          {priceLabel}
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <button onClick={onBack} style={{ float: 'left', padding: '10px', cursor: 'pointer', color: '#007bff' }}>← Back to Summary</button>
      <div style={{ clear: 'both' }}></div>

      <h2>Select Seats: Flight {flight.flightNumber}</h2>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', fontSize: '0.9em' }}>
        <div><span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#ffffff', border: '1px solid #ccc', marginRight: '5px' }}></span>Available</div>
        <div><span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#d3d3d3', marginRight: '5px' }}></span>Unavailable</div>
        <div><span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#28a745', marginRight: '5px' }}></span>Selected</div>
      </div>
      
      <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        {passengers.map(p => (
          <div key={p.passengerId} style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '15px', backgroundColor: Object.values(seatAssignments).some(v => v.passengerId === p.passengerId) ? '#e6fffa' : '#fff' }}>
            {p.firstName}
          </div>
        ))}
      </div>
      {loading ? <p>Loading...</p> : <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>{Object.keys(groupedSeats).map(cn => renderCabin(cn, groupedSeats[cn]))}</div>}
      <button 
        disabled={Object.keys(seatAssignments).length !== passengers.length}
        onClick={() => onSeatsConfirmed(seatAssignments)}
        style={{ marginTop: '20px', padding: '15px 30px', backgroundColor: Object.keys(seatAssignments).length === passengers.length ? '#007bff' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Confirm Seat(s)
      </button>
    </div>
  );
};

export default SeatSelection;