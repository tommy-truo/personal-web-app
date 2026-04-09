import React, { useState, useEffect } from 'react';

const SeatSelection = ({ flight, passengers, userID, onBack }) => {
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
      if (selectedSeats.length < passengers) {
        setSelectedSeats([...selectedSeats, seat.id]);
      } else {
        alert(`You can only select ${passengers} seats.`);
      }
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <button onClick={onBack} style={{ float: 'left', cursor: 'pointer' }}>← Back to Search</button>
      <h2>Select Your Seats</h2>
      <p>Flight {flight.flightNumber}: Select {passengers} seat(s)</p>

      {loading ? <p>Loading seat map...</p> : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 50px)', // Adjust columns based on plane size
          gap: '10px', 
          justifyContent: 'center',
          margin: '40px 0'
        }}>
          {seats.map((seat) => (
            <div
              key={seat.id}
              onClick={() => handleSeatClick(seat)}
              style={{
                width: '50px',
                height: '50px',
                border: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: seat.isAvailable ? 'pointer' : 'not-allowed',
                backgroundColor: !seat.isAvailable ? '#d3d3d3' : selectedSeats.includes(seat.id) ? '#28a745' : '#ffffff',
                color: selectedSeats.includes(seat.id) ? 'white' : 'black',
                borderRadius: '4px',
                fontSize: '0.8em'
              }}
            >
              {seat.number}
            </div>
          ))}
        </div>
      )}

      <button 
        disabled={selectedSeats.length !== parseInt(passengers)}
        style={{
          padding: '10px 30px',
          backgroundColor: selectedSeats.length === parseInt(passengers) ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}
        onClick={() => alert('Booking created!')}
      >
        Confirm Booking
      </button>
    </div>
  );
};

export default SeatSelection;