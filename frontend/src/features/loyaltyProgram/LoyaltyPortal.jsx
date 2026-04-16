import React, { useState, useEffect } from 'react';

const url = import.meta.env.VITE_API_URL;

const LoyaltyPortal = ({ userID, onNavigate }) => {
  const [primaryUser, setPrimaryUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (!userID) return;

    const fetchPrimaryPassenger = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${url}/api/passengers/users/${userID}/passengers`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        const primary = data.find(p => p.isPrimary === true);
        setPrimaryUser(primary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrimaryPassenger();
  }, [userID]);

    const handleEnroll = async () => {
        if (!primaryUser?.passengerId) return;
        try {
            setIsEnrolling(true);
            const response = await fetch(`${url}/api/passengers/${primaryUser.passengerId}/enroll`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setPrimaryUser({
                ...primaryUser,
                ...updatedUser,
                isLoyaltyMember: true,
                loyaltyMiles: updatedUser.loyaltyMiles ?? 0
                });
            } else {
                throw new Error("Failed to enroll");
            }
        } catch (err) {
            console.error(err);
            alert("Could not enroll at this time.");
        } finally {
            setIsEnrolling(false); 
        }
    };

  if (loading) return <div style={styles.loader}>Loading your rewards...</div>;
  if (!primaryUser) return null;

  const isLoyaltyMember = primaryUser.isLoyaltyMember;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.name}>
            {primaryUser.firstName} {primaryUser.lastName}
          </h1>
          <div style={styles.badge}>Primary Member</div>
        </div>

        {isLoyaltyMember ? (
          /* LOYALTY MEMBER VIEW */
          <>
            <div style={styles.milesContainer}>
              <span style={styles.milesLabel}>Current Balance</span>
              <div style={styles.milesValue}>
                {primaryUser.loyaltyMiles?.toLocaleString()}
                <span style={styles.milesUnit}> miles</span>
              </div>
            </div>

            {/* Separated Footer (Hidden for non-members) */}
            <div style={styles.footerAction}>
              <p style={styles.footerText}>
                Redeem your next adventure, you earned it!
              </p>
              <button
                onClick={() => onNavigate('search')}
                style={styles.bookTripBtn}
              >
                Redeem Miles
              </button>
            </div>
          </>
        ) : (
          /* NON-MEMBER VIEW */
          <div style={styles.enrollContainer}>
            <div style={styles.enrollCta}>
              <p style={styles.enrollText}>You aren't a loyalty member yet.</p>
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                style={styles.enrollBtn}
              >
                {isEnrolling ? 'Processing...' : 'Unlock Member Rewards'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    fontFamily: '"Inter", -apple-system, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '32px 32px 10px 32px', // Bottom padding adjusted for footer
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
    border: '1px solid #f1f5f9'
  },
  header: {
    marginBottom: '32px'
  },
  name: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  milesContainer: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    borderRadius: '20px',
    padding: '32px 20px',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
  },
  milesLabel: {
    fontSize: '0.875rem',
    opacity: 0.8,
    display: 'block',
    marginBottom: '4px'
  },
  milesValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
  },
  milesUnit: {
    fontSize: '1rem',
    fontWeight: '400',
    opacity: 0.9
  },
  enrollContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '32px 20px',
    border: '1px dashed #cbd5e1'
  },
  enrollCta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  enrollText: {
    color: '#475569',
    margin: 0,
    fontSize: '0.95rem'
  },
  enrollBtn: {
    backgroundColor: '#0f172a',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  bookTripBtn: { 
    display: 'inline-block', 
    backgroundColor: '#3182ce', 
    color: 'white', 
    border: 'none', 
    cursor: 'pointer',
    padding: '12px 28px', 
    borderRadius: '8px', 
    fontWeight: 'bold', 
    boxShadow: '0 4px 10px rgba(49, 130, 206, 0.3)' 
  },
  footerAction: { 
    marginTop: '30px', 
    textAlign: 'center', 
    padding: '24px 0', 
    borderTop: '1px dashed #e2e8f0' 
  },
  footerText: { 
    color: '#718096', 
    fontSize: '0.9rem',
    marginBottom: '15px',
    lineHeight: '1.4'
  },
  loader: {
    textAlign: 'center',
    padding: '60px',
    color: '#94a3b8'
  }
};

export default LoyaltyPortal;