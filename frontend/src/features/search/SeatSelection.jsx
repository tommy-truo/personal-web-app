import React, { useState, useEffect } from 'react';

const SeatSelection = ({ flight, passengersNumber, userID, onBack }) => {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const url = import.meta.env.VITE_API_URL;
        const response = await fetch(`${url}/api/flights/${flight.flightInstanceId}/seats`);
        const data = await response.json();
        setSeats(data);
      } catch (err) {
        console.error("Error fetching seats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [flight.flightInstanceId]);

  const handleSeatClick = (seat) => {
    if (!seat.isAvailable) return;

    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat.id));
    } else {
      if (selectedSeats.length < passengersNumber) {
        setSelectedSeats([...selectedSeats, seat.id]);
      } else {
        alert(`You can only select ${passengersNumber} seats.`);
      }
    }
  };

  // 1. Group seats by Class
  const groupedSeats = seats.reduce((acc, seat) => {
    const className = seat.class || 'Economy';
    if (!acc[className]) acc[className] = [];
    acc[className].push(seat);
    return acc;
  }, {});

  // 2. Helper to render a specific cabin section
  const renderCabinSection = (className, cabinSeats) => {
    // Determine unique rows and columns in this cabin
    const uniqueRows = [...new Set(cabinSeats.map(s => s.row))].sort((a, b) => a - b);
    const uniqueCols = [...new Set(cabinSeats.map(s => s.col))].sort();
    
    // Calculate middle for aisle (e.g., if 6 cols, aisle is after 3rd)
    const aisleIndex = Math.floor(uniqueCols.length / 2);
    uniqueCols.splice(aisleIndex, 0, 'AISLE'); // Insert a placeholder for the aisle

    return (
      <div key={className} style={{ marginBottom: '40px' }}>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{className}</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${uniqueCols.length}, 50px)`,
          gap: '10px',
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          {uniqueRows.map(rowNum => (
            <React.Fragment key={rowNum}>
              {uniqueCols.map((colLetter, index) => {
                const seat = cabinSeats.find(s => s.row === rowNum && s.col === colLetter);
                
                // If seat doesn't exist for this specific grid coordinate, render empty div
                if (!seat) return <div key={`${rowNum}-${colLetter}`} style={{ width: '50px' }} />;

                if (colLetter === 'AISLE') {
                  return <div key={`${rowNum}-${colLetter}`} style={{ width: '50px', border: '1px solid #ccc' }} />;
                }

                return (
                  <div
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    style={{
                      width: '50px',
                      height: '50px',
                      border: '1px solid #ccc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: seat.isAvailable ? 'pointer' : 'not-allowed',
                      backgroundColor: !seat.isAvailable ? '#d3d3d3' : selectedSeats.includes(seat.id) ? '#28a745' : '#ffffff',
                      color: selectedSeats.includes(seat.id) ? 'white' : 'black',
                      borderRadius: '4px',
                      fontSize: '0.75em',
                      transition: '0.2s all',
                      marginRight: index === aisleIndex ? '30px' : '0px' // AISLE SPACER
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>{seat.row}{seat.col}</span>
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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <button onClick={onBack} style={{ float: 'left', padding: '8px', cursor: 'pointer' }}>← Back</button>
      <div style={{ clear: 'both' }}></div>
      
      <h2 style={{ marginTop: '20px' }}>Select Your Seats</h2>
      <p>Flight {flight.flightNumber}</p>
      <p>Passengers: {passengersNumber}</p>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', fontSize: '0.9em' }}>
        <div><span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#ffffff', border: '1px solid #ccc', marginRight: '5px' }}></span>Available</div>
        <div><span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#d3d3d3', marginRight: '5px' }}></span>Occupied</div>
        <div><span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#28a745', marginRight: '5px' }}></span>Selected</div>
      </div>

      {loading ? (
        <p>Loading seat map...</p>
      ) : (
        <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '20px', border: '2px solid #ddd' }}>
          {Object.keys(groupedSeats).map(className => 
            renderCabinSection(className, groupedSeats[className])
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', position: 'sticky', bottom: '20px', backgroundColor: 'white', padding: '20px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
        <p style={{ marginBottom: '10px' }}>
          Selected Seats: <b>
            {selectedSeats.length > 0 
              ? selectedSeats.map(id => {
                  const seat = seats.find(s => s.id === id);
                  return seat ? `${seat.row}${seat.col}` : '';
                }).join(', ') 
              : 'None'}
          </b>
        </p>
        <button 
          disabled={selectedSeats.length !== parseInt(passengersNumber)}
          style={{
            padding: '12px 40px',
            backgroundColor: selectedSeats.length === parseInt(passengersNumber) ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: selectedSeats.length === parseInt(passengersNumber) ? 'pointer' : 'not-allowed'
          }}
          onClick={() => alert(`Booking confirmed for seats: ${selectedSeats.map(id => {const seat = seats.find(s => s.id === id);return seat ? `${seat.row}${seat.col}` : '';}).join(', ') } `)}
        >
          Confirm {passengersNumber} Seat(s)
        </button>
      </div>
    </div>
  );
};

export default SeatSelection;