import React, { useState, useEffect } from 'react';

const PassengerSelection = ({ userID, occupiedPassengerIds = [], requiredCount, onConfirm }) => {
  const [availablePassengers, setAvailablePassengers] = useState([]);
  const [selectedList, setSelectedList] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const url = import.meta.env.VITE_API_URL;

  const initialGuestState = {
    firstName: '',
    middleInitial: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    relationship: 'Friend',
    phoneNumber: '',
    passportNumber: '',
    passportCountry: '',
    passportExpiration: ''
  };

  const [newGuest, setNewGuest] = useState(initialGuestState);

  useEffect(() => {
    // Fetch all passengers associated with the user
    fetch(`${url}/api/passengers/users/${userID}/passengers`)
      .then(res => res.json())
      .then(data => setAvailablePassengers(data))
      .catch(err => console.error("Error fetching passengers:", err));
  }, [userID, url]);

  const togglePassenger = (p) => {
    // Logic updated to check against the prop passed from BookingSummary
    if (occupiedPassengerIds.includes(p.passengerId)) return;

    if (selectedList.find(item => item.passengerId === p.passengerId)) {
      setSelectedList(selectedList.filter(item => item.passengerId !== p.passengerId));
    } else if (selectedList.length < requiredCount) {
      setSelectedList([...selectedList, p]);
    }
  };

  const handleQuickAdd = async () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.dateOfBirth || !newGuest.gender) {
      alert("Please fill in Name, DOB, and Gender to add a guest.");
      return;
    }

    try {
      const response = await fetch(`${url}/api/passengers/users/${userID}/passengers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      });

      if (response.ok) {
        const createdGuest = await response.json();
        setAvailablePassengers(prev => [...prev, createdGuest]);
        // Auto-select if there is room
        if (selectedList.length < requiredCount) {
          setSelectedList(prev => [...prev, createdGuest]);
        }
        setIsAddingNew(false);
        setNewGuest(initialGuestState);
      }
    } catch (err) {
      alert("Failed to add guest passenger.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>Select Passengers</h3>
        <span style={styles.countBadge}>
          {selectedList.length} / {requiredCount} Selected
        </span>
      </div>

      <div style={styles.list}>
        {availablePassengers.map(p => {
          const isSelected = !!selectedList.find(item => item.passengerId === p.passengerId);
          // Check if ID is in the global occupied list passed from parent
          const isAlreadyOnFlight = occupiedPassengerIds.includes(p.passengerId);

          return (
            <label 
              key={p.passengerId} 
              style={{
                ...styles.passengerCard,
                borderColor: isSelected ? '#3182ce' : (isAlreadyOnFlight ? '#e2e8f0' : '#eee'),
                backgroundColor: isSelected ? '#ebf8ff' : (isAlreadyOnFlight ? '#f7fafc' : '#fff'),
                cursor: isAlreadyOnFlight ? 'not-allowed' : 'pointer',
                opacity: isAlreadyOnFlight ? 0.6 : 1
              }}
            >
              <input 
                type="checkbox"
                disabled={isAlreadyOnFlight}
                checked={isSelected}
                onChange={() => togglePassenger(p)}
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  accentColor: '#3182ce',
                  cursor: isAlreadyOnFlight ? 'not-allowed' : 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: isAlreadyOnFlight ? '#718096' : '#2d3748' }}>
                  {p.firstName} {p.middleInitial ? `${p.middleInitial}. ` : ''}{p.lastName} {p.isPrimary ? '(Self)' : ''}
                  {isAlreadyOnFlight && <span style={styles.alreadyLabel}> (Unavailable for this trip)</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                  {p.gender} • DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {!isAddingNew ? (
        <button onClick={() => setIsAddingNew(true)} style={styles.toggleAddBtn}>
          + Add a guest passenger
        </button>
      ) : (
        <div style={styles.quickAddForm}>
          <h4 style={{ marginTop: 0, marginBottom: '20px' }}>Quick Add Guest</h4>
          
          <div style={styles.formGrid}>
            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>First Name*</label>
              <input style={styles.smallInput} value={newGuest.firstName} onChange={e => setNewGuest({...newGuest, firstName: e.target.value})} />
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>M.I.</label>
              <input style={styles.smallInput} maxLength="1" value={newGuest.middleInitial} onChange={e => setNewGuest({...newGuest, middleInitial: e.target.value})} />
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>Last Name*</label>
              <input style={styles.smallInput} value={newGuest.lastName} onChange={e => setNewGuest({...newGuest, lastName: e.target.value})} />
            </div>
            <div style={styles.inputWrapper}>
               <label style={styles.miniLabel}>Date of Birth*</label>
               <input type="date" style={styles.smallInput} value={newGuest.dateOfBirth} onChange={e => setNewGuest({...newGuest, dateOfBirth: e.target.value})} />
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>Gender*</label>
              <select style={styles.smallInput} value={newGuest.gender} onChange={e => setNewGuest({...newGuest, gender: e.target.value})}>
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="U">Other</option>
              </select>
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>Relationship</label>
              <select style={styles.smallInput} value={newGuest.relationship} onChange={e => setNewGuest({...newGuest, relationship: e.target.value})}>
                <option value="Family">Family</option>
                <option value="Friend">Friend</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
            <button onClick={handleQuickAdd} style={styles.saveGuestBtn}>Add to List</button>
            <button onClick={() => setIsAddingNew(false)} style={styles.cancelGuestBtn}>Cancel</button>
          </div>
        </div>
      )}

      <button 
        disabled={selectedList.length !== parseInt(requiredCount)}
        onClick={() => onConfirm(selectedList)}
        style={{
          ...styles.confirmBtn,
          backgroundColor: selectedList.length === parseInt(requiredCount) ? '#28a745' : '#cbd5e0',
          cursor: selectedList.length === parseInt(requiredCount) ? 'pointer' : 'not-allowed'
        }}
      >
        Confirm {requiredCount} Passenger(s)
      </button>
    </div>
  );
};

const styles = {
  container: { padding: '10px 0', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  countBadge: { padding: '4px 12px', backgroundColor: '#edf2f7', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  passengerCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '2px solid', borderRadius: '10px', transition: 'all 0.2s' },
  alreadyLabel: { fontSize: '0.75rem', fontStyle: 'italic', color: '#a0aec0', marginLeft: '5px' },
  toggleAddBtn: { marginTop: '15px', background: 'none', border: '1px dashed #3182ce', color: '#3182ce', padding: '10px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: '600' },
  quickAddForm: { marginTop: '15px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' },
  inputWrapper: { display: 'flex', flexDirection: 'column', gap: '4px' },
  miniLabel: { fontSize: '0.75rem', fontWeight: 'bold', color: '#4a5568' },
  smallInput: { padding: '8px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' },
  saveGuestBtn: { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  cancelGuestBtn: { background: 'none', border: '1px solid #cbd5e0', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', color: '#718096' },
  confirmBtn: { marginTop: '30px', width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', transition: 'background-color 0.3s' }
};

export default PassengerSelection;