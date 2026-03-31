import React, { useState, useEffect } from 'react';

const url = `http://localhost:5001`; // Base URL for API calls

const Profile = ({ userID }) => {
  const [primaryUser, setPrimaryUser] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState({});

  const initialFormState = { 
    firstName: '', 
    middleInitial: '', 
    lastName: '', 
    relationship: 'Other',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    passportNumber: '',
    passportCountry: '',
    passportExpiration: '',
    knownTravelerNumber: ''
  };

  const [editFormData, setEditFormData] = useState(initialFormState);

  useEffect(() => {
    if (!userID) {
      console.log("Waiting for userID prop...");
      return;
    }

    const fetchPassengers = async () => {
      try {
        setLoading(true);
        console.log("Fetching for userID:", userID);
        const response = await fetch(`${url}/api/passengers/users/${userID}/passengers`);
        if (!response.ok) throw new Error('Failed to fetch passenger data');
        const data = await response.json();
        setPrimaryUser(data.find(p => p.isPrimary === true));
        setGuests(data.filter(p => p.isPrimary !== true));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPassengers();
  }, [userID]);

  const validateForm = () => {
    const newErrors = {};
    if (!editFormData.firstName.trim()) newErrors.firstName = true;
    if (!editFormData.lastName.trim()) newErrors.lastName = true;
    if (!editFormData.dateOfBirth) newErrors.dateOfBirth = true;
    if (!editFormData.gender) newErrors.gender = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      alert("Please fill in all required fields marked with *");
      return false;
    }
    return true;
  };

  const startEdit = (passenger) => {
    setIsAdding(false);
    setErrors({});
    setEditingId(passenger.passengerId);
    setEditFormData({
      firstName: passenger.firstName || '',
      middleInitial: passenger.middleInitial || '',
      lastName: passenger.lastName || '',
      // If it's the primary user, force 'Self', otherwise use existing relationship
      relationship: passenger.isPrimary ? 'Self' : (passenger.relationship || 'Other'),
      dateOfBirth: passenger.dateOfBirth ? passenger.dateOfBirth.split('T')[0] : '',
      gender: passenger.gender || '',
      phoneNumber: passenger.phoneNumber || '',
      passportNumber: passenger.passportNumber || '',
      passportCountry: passenger.passportCountry || '',
      passportExpiration: passenger.passportExpiration ? passenger.passportExpiration.split('T')[0] : '',
      knownTravelerNumber: passenger.knownTravelerNumber || ''
    });
  };

  const handlePatchPassenger = async (passengerID) => {
    if (!validateForm()) return;

    const cleanData = Object.keys(editFormData).reduce((acc, key) => {
      const value = editFormData[key];
      acc[key] = (typeof value === 'string' && value.trim() === '') ? null : value;
      return acc;
    }, {});

    try {
      const response = await fetch(`${url}/api/passengers/users/${userID}/passengers/${passengerID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });
      if (response.ok) {
        if (primaryUser && primaryUser.passengerId === passengerID) {
          setPrimaryUser({ ...primaryUser, ...cleanData });
        } else {
          setGuests(prev => prev.map(g => g.passengerId === passengerID ? { ...g, ...cleanData } : g));
        }
        setEditingId(null);
        setErrors({});
      }
    } catch (err) { alert("Error updating passenger"); }
  };

  const handleAddGuest = async () => {
    if (!validateForm()) return;
    const cleanData = Object.keys(editFormData).reduce((acc, key) => {
      const value = editFormData[key];
      acc[key] = (typeof value === 'string' && value.trim() === '') ? null : value;
      return acc;
    }, {});

    try {
      const response = await fetch(`${url}/api/passengers/users/${userID}/passengers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });
      if (response.ok) {
        const newGuest = await response.json();
        setGuests(prev => [...prev, newGuest]);
        setIsAdding(false);
        setEditFormData(initialFormState);
        setErrors({});
      }
    } catch (err) { alert("Error adding guest"); }
  };

  const deleteGuest = async (passengerID) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const response = await fetch(`${url}/api/passengers/users/${userID}/passengers/${passengerID}`, { method: 'DELETE' });
      if (response.ok) setGuests(prev => prev.filter(g => g.passengerId !== passengerID));
    } catch (err) { alert("Error deleting guest"); }
  };

  const getInputStyle = (fieldName) => ({
    ...styles.input,
    borderColor: errors[fieldName] ? '#e53e3e' : '#cbd5e0',
    backgroundColor: errors[fieldName] ? '#fff5f5' : '#fff'
  });

  const renderEditForm = (isNew = false, id = null) => {
    // Check if the current form being rendered belongs to the primary user
    const isPrimaryEditing = primaryUser && id === primaryUser.passengerId;

    return (
      <div style={styles.editGrid}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>First Name <span style={styles.required}>*</span></label>
          <input value={editFormData.firstName} onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})} style={getInputStyle('firstName')} />
        </div>
        <div style={{ ...styles.fieldGroup, width: '50px' }}>
          <label style={styles.label}>M.I.</label>
          <input value={editFormData.middleInitial} maxLength="1" onChange={(e) => setEditFormData({...editFormData, middleInitial: e.target.value})} style={styles.input} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Last Name <span style={styles.required}>*</span></label>
          <input value={editFormData.lastName} onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})} style={getInputStyle('lastName')} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Date of Birth <span style={styles.required}>*</span></label>
          <input type="date" value={editFormData.dateOfBirth} onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})} style={getInputStyle('dateOfBirth')} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Gender <span style={styles.required}>*</span></label>
          <select value={editFormData.gender} onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})} style={{...styles.select, borderColor: errors.gender ? '#e53e3e' : '#cbd5e0'}}>
            <option value="" disabled hidden>Select</option>
            <option value='M'>Male</option>
            <option value='F'>Female</option>
            <option value='U'>Other</option>
          </select>
        </div>

        {/* HIDE RELATIONSHIP IF PRIMARY USER */}
        {!isPrimaryEditing && (
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Relationship</label>
            <select value={editFormData.relationship} onChange={(e) => setEditFormData({...editFormData, relationship: e.target.value})} style={styles.select}>
              <option value='Family'>Family</option>
              <option value='Friend'>Friend</option>
              <option value='Business'>Business</option>
              <option value='Other'>Other</option>
            </select>
          </div>
        )}

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Phone Number</label>
          <input value={editFormData.phoneNumber} onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})} style={styles.input} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Passport #</label>
          <input value={editFormData.passportNumber} onChange={(e) => setEditFormData({...editFormData, passportNumber: e.target.value})} style={styles.input} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Passport Country</label>
          <input value={editFormData.passportCountry} onChange={(e) => setEditFormData({...editFormData, passportCountry: e.target.value})} style={styles.input} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Passport Exp</label>
          <input type="date" value={editFormData.passportExpiration} onChange={(e) => setEditFormData({...editFormData, passportExpiration: e.target.value})} style={styles.input} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>KTN</label>
          <input value={editFormData.knownTravelerNumber} onChange={(e) => setEditFormData({...editFormData, knownTravelerNumber: e.target.value})} style={styles.input} />
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
          <button onClick={isNew ? handleAddGuest : () => handlePatchPassenger(id)} style={styles.saveBtn}>
            {isNew ? 'Create' : 'Save Changes'}
          </button>
          <button onClick={() => { setEditingId(null); setIsAdding(false); setErrors({}); }} style={styles.cancelBtn}>Cancel</button>
        </div>
      </div>
    );
  };

  const displayVal = (val) => (val && val !== '') ? val : 'N/A';

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Profile...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2d3748', marginBottom: '30px' }}>Account Settings</h1>
      
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem' }}>Primary Passenger</h2>
            <p style={{ margin: '5px 0 0 0', color: '#718096', fontSize: '0.9rem' }}>Your personal passenger information </p>
          </div>
          {editingId !== primaryUser?.passengerId && (
            <button onClick={() => startEdit(primaryUser)} style={styles.addBtn}>Edit Personal Info</button>
          )}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '20px' }} />
        
        {primaryUser && (
          editingId === primaryUser.passengerId ? renderEditForm(false, primaryUser.passengerId) : (
            <div style={styles.primaryGrid}>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Full Name</span>
                <span style={styles.dataValue}>{primaryUser.firstName} {primaryUser.middleInitial ? `${primaryUser.middleInitial}. ` : ''}{primaryUser.lastName}</span>
              </div>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Date of Birth</span>
                <span style={styles.dataValue}>{primaryUser.dateOfBirth ? new Date(primaryUser.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Gender</span>
                <span style={styles.dataValue}>{displayVal(primaryUser.gender)}</span>
              </div>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Phone Number</span>
                <span style={styles.dataValue}>{displayVal(primaryUser.phoneNumber)}</span>
              </div>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Passport Number</span>
                <span style={styles.dataValue}>{displayVal(primaryUser.passportNumber)}</span>
              </div>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Passport Country</span>
                <span style={styles.dataValue}>{displayVal(primaryUser.passportCountry)}</span>
              </div>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Passport Expiration</span>
                <span style={styles.dataValue}>{primaryUser.passportExpiration ? new Date(primaryUser.passportExpiration).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={styles.dataBox}>
                <span style={styles.dataLabel}>Known Traveler # (KTN)</span>
                <span style={styles.dataValue}>{displayVal(primaryUser.knownTravelerNumber)}</span>
              </div>
            </div>
          )
        )}
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#4a5568' }}>Linked Guest Passengers</h3>
          {!isAdding && (
            <button onClick={() => { setIsAdding(true); setEditingId(null); setEditFormData(initialFormState); setErrors({}); }} style={styles.addBtn}>
              + Add New Guest
            </button>
          )}
        </div>

        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '10px' }}>Passenger Details</th>
              <th>Relationship</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.passengerId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px 10px' }}>
                  {editingId === guest.passengerId ? renderEditForm(false, guest.passengerId) : (
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                        {guest.firstName} {guest.middleInitial ? `${guest.middleInitial}. ` : ''}{guest.lastName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '6px' }}>
                        <span style={styles.infoTag}>Gender: {displayVal(guest.gender)}</span>
                        <span style={styles.infoTag}>DOB: {guest.dateOfBirth ? new Date(guest.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                        <span style={styles.infoTag}>Passport: {displayVal(guest.passportNumber)}</span>
                      </div>
                    </div>
                  )}
                </td>
                <td style={{ verticalAlign: 'top', paddingTop: '15px' }}>
                  {editingId !== guest.passengerId && <span style={styles.relBadge}>{guest.relationship || 'Other'}</span>}
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '15px' }}>
                  {editingId !== guest.passengerId && (
                    <>
                      <button onClick={() => startEdit(guest)} style={styles.linkBtn}>Edit</button>
                      <button onClick={() => deleteGuest(guest.passengerId)} style={{ ...styles.linkBtn, color: '#e53e3e' }}>Remove</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isAdding && (
          <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e0' }}>
            <h4 style={{ marginTop: 0 }}>New Guest Information</h4>
            {renderEditForm(true)}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  linkBtn: { marginRight: '15px', color: '#3182ce', cursor: 'pointer', border: 'none', background: 'none', fontWeight: '600' },
  addBtn: { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
  saveBtn: { color: 'white', backgroundColor: '#48bb78', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { color: '#718096', background: 'none', border: '1px solid #cbd5e0', padding: '7px 16px', borderRadius: '4px', cursor: 'pointer' },
  input: { padding: '8px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' },
  select: { padding: '8px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.85rem', width: '100%' },
  relBadge: { color: '#4a5568', fontSize: '0.85rem', backgroundColor: '#edf2f7', padding: '4px 10px', borderRadius: '20px', fontWeight: '500' },
  infoTag: { marginRight: '12px', paddingRight: '12px', borderRight: '1px solid #e2e8f0' },
  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', alignItems: 'end' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.75rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' },
  required: { color: '#e53e3e', marginLeft: '2px' },
  primaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' },
  dataBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
  dataLabel: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a0aec0', fontWeight: '700' },
  dataValue: { fontSize: '1rem', color: '#2d3748', fontWeight: '500' }
};

export default Profile;