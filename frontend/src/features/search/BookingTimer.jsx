import React, { useState, useEffect } from 'react';

const BookingTimer = ({ expiryTimestamp, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = expiryTimestamp - now;

      if (distance < 0) {
        onExpire();
        return "00:00";
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Initial call
    setTimeLeft(calculateTime());

    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTimestamp, onExpire]);

  return (
    <div style={timerStyles.container}>
      <div style={timerStyles.label}>Selections Reserved For:</div>
      <div style={{ 
        ...timerStyles.time, 
        color: timeLeft.startsWith('00') ? '#dc3545' : '#007bff' 
      }}>
        {timeLeft}
      </div>
    </div>
  );
};

const timerStyles = {
  container: {
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  label: { fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px' },
  time: { fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }
};

export default BookingTimer;