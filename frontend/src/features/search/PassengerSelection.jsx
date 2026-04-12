import React, { useState, useEffect } from 'react';

const PassengerSelection = ({ userID, requiredCount, onConfirm }) => {
  const [availablePassengers, setAvailablePassengers] = useState([]);
  const [selectedList, setSelectedList] = useState([]);
  const url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${url}/api/passengers/users/${userID}/passengers`)
      .then(res => res.json())
      .then(data => setAvailablePassengers(data));
  }, [userID]);

  const togglePassenger = (p) => {
    if (selectedList.find(item => item.passengerId === p.passengerId)) {
      setSelectedList(selectedList.filter(item => item.passengerId !== p.passengerId));
    } else if (selectedList.length < requiredCount) {
      setSelectedList([...selectedList, p]);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div>Select {requiredCount} Passenger(s)</div>
      {availablePassengers.map(p => (
        <div key={p.passengerId} style={{ padding: '10px', border: '1px solid #eee', margin: '5px 0', display: 'flex', gap: '10px' }}>
          <input 
            type="checkbox"
            checked={!!selectedList.find(item => item.passengerId === p.passengerId)}
            onChange={() => togglePassenger(p)}
          />
          <span>{p.firstName} {p.lastName} {p.isPrimary ? '(Self)' : ''}</span>
        </div>
      ))}
      <button 
        disabled={selectedList.length !== parseInt(requiredCount)}
        onClick={() => onConfirm(selectedList)}
        style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: selectedList.length === parseInt(requiredCount) ? '#28a745' : '#ccc' }}
      >
        Confirm Passengers
      </button>
    </div>
  );
};

export default PassengerSelection;