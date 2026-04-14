import React, { useState, useEffect } from 'react';

const PassengerSelection = ({ userID, requiredCount, onConfirm }) => {
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
        <h2 style={{ margin: 0 }}>Select Passengers</h2>
        <span style={styles.countBadge}>
          {selectedList.length} / {requiredCount} Selected
        </span>
      </div>

      <div style={styles.list}>
        {availablePassengers.map(p => (
          <label key={p.passengerId} style={{
            ...styles.passengerCard,
            borderColor: selectedList.find(item => item.passengerId === p.passengerId) ? '#3182ce' : '#eee',
            backgroundColor: selectedList.find(item => item.passengerId === p.passengerId) ? '#ebf8ff' : '#fff'
          }}>
            <input 
              type="checkbox"
              checked={!!selectedList.find(item => item.passengerId === p.passengerId)}
              onChange={() => togglePassenger(p)}
              style={{ width: '18px', height: '18px', accentColor: '#3182ce' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>
                {p.firstName} {p.middleInitial ? `${p.middleInitial}. ` : ''}{p.lastName} {p.isPrimary ? '(Self)' : ''}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                {p.gender} • DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </label>
        ))}
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

            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>Phone Number</label>
              <input style={styles.smallInput} value={newGuest.phoneNumber} onChange={e => setNewGuest({...newGuest, phoneNumber: e.target.value})} />
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>Passport #</label>
              <input style={styles.smallInput} value={newGuest.passportNumber} onChange={e => setNewGuest({...newGuest, passportNumber: e.target.value})} />
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.miniLabel}>Passport Country</label>
              <input style={styles.smallInput} value={newGuest.passportCountry} onChange={e => setNewGuest({...newGuest, passportCountry: e.target.value})} />
            </div>
            
            <div style={styles.inputWrapper}>
               <label style={styles.miniLabel}>Passport Exp</label>
               <input type="date" style={styles.smallInput} value={newGuest.passportExpiration} onChange={e => setNewGuest({...newGuest, passportExpiration: e.target.value})} />
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
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  countBadge: { padding: '4px 12px', backgroundColor: '#edf2f7', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  passengerCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '2px solid', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' },
  toggleAddBtn: { marginTop: '15px', background: 'none', border: '1px dashed #3182ce', color: '#3182ce', padding: '10px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: '600' },
  quickAddForm: { marginTop: '15px', padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  // Changed to a grid to keep everything aligned and same-sized
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' },
  inputWrapper: { display: 'flex', flexDirection: 'column', gap: '4px' },
  miniLabel: { fontSize: '0.75rem', fontWeight: 'bold', color: '#4a5568', marginLeft: '2px' },
  smallInput: { 
    padding: '10px', 
    border: '1px solid #cbd5e0', 
    borderRadius: '6px', 
    fontSize: '0.85rem', 
    backgroundColor: 'white',
    width: '100%', 
    boxSizing: 'border-box' // Essential for same-sizing with padding
  },
  saveGuestBtn: { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  cancelGuestBtn: { background: 'none', border: '1px solid #cbd5e0', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', color: '#718096' },
  confirmBtn: { marginTop: '30px', width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', transition: 'background-color 0.3s' }
};

export default PassengerSelection;