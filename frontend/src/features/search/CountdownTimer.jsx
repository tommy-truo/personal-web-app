import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ expiryTimestamp, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    // Difference between now and the target date in milliseconds
    const difference = new Date(expiryTimestamp) - new Date();
    
    if (difference <= 0) return 0;
    return difference;
  }

  useEffect(() => {
    // If the timer reaches zero, stop and trigger the callback
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, expiryTimestamp, onExpire]);

  // Format milliseconds into MM:SS
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft < (5 * 60000); // Less than 5 minutes remaining

  return (
    <div style={{
      ...styles.timerContainer,
      backgroundColor: isUrgent ? '#fff5f5' : '#f7fafc',
      borderColor: isUrgent ? '#feb2b2' : '#e2e8f0'
    }}>
      <span style={styles.label}>Booking expires in:</span>
      <span style={{
        ...styles.time,
        color: isUrgent ? '#e53e3e' : '#2d3748'
      }}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

const styles = {
  timerContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid',
    transition: 'all 0.3s ease'
  },
  label: {
    fontSize: '0.9rem',
    color: '#2e343c',
    fontWeight: 'bold'
  },
  time: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    fontFamily: 'monospace'
  }
};

export default CountdownTimer;