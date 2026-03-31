
import React, { useState } from 'react';
import './SignUp.css';

const SignUp = ({ onSwitch }) => {
  const [form, setForm] = useState({            // Form Fields
    firstName: '',
    middleInitial: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
    isLoyaltyMember: false
  });

  const handleChange = (e) => {                 //handlechange
    const { id, type, checked, value } = e.target;
    
    let val = type === 'checkbox' ? checked : value;  // Checkbox value
    
    if (id==='middleInitial'&& val.length > 1){
      val=val.charAt(0).toUpperCase();
    }

    setForm({ ...form, [id]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {   // password Verification and error message
      alert("Passwords don't match!"); 
      return;
    }



    console.log("Sending signup data...", form); // console log

    try {
      const res = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      
      if (res.ok) {
        alert("Account created!"); 
        onSwitch(); 
      } else {
        alert(result.message || "Signup failed");
      }
    } catch (err) {
      console.error("Auth Error:", err);
      alert("Backend isn't responding.");
    }
  };

  return (                                            //page layout
    <div className='login-page'>
      <div className="light-red-page">
        <nav className="navbar navbar-expand-lg navbar-light-red">
          <div className="container-fluid">
            <a className="navbar-brand brand-text" href="#">
              <img src="acmelogo.png" alt="logo" className="navbar-logo me-2" />
              ACME Airlines
            </a>
          </div>
        </nav>
      </div>

      <div className='form-wrapper'>
        <div className='signup-container'>
          <form onSubmit={handleSubmit}>
            <h2 className='form-title'>Create an Account</h2>

            
            <div className='form-field'>
              <label>First Name</label>
              <input type='text' id='firstName' value={form.firstName} onChange={handleChange} placeholder='First Name' maxLength="50" required />
            </div>

            <div className='form-field'>
              <label>Middle Initial</label>
              <input type='text' id='middleInitial' value={form.middleInitial} onChange={handleChange} placeholder='Middle Initial' maxLength="1" />
            </div>



            <div className='form-field'>
              <label>Last Name</label>
              <input type='text' id='lastName' value={form.lastName} onChange={handleChange} placeholder='Last Name' maxLength="50" required />
            </div>

            <div className='form-field'>
              <label>Birthday</label>
              <input type='date' id='dob' value={form.dob} onChange={handleChange} required />
            </div>

            <div className='form-field'>
              <label>Email</label>
              <input type='email' id='email' value={form.email} onChange={handleChange} placeholder='Email' required />
            </div>

           
            <div className='form-field'>
              <label>Password</label>
              <input type='password' id='password' value={form.password} onChange={handleChange} placeholder='Min 8 characters' required />
            </div>

            <div className='form-field'>
              <label>Confirm Password</label>
              <input type='password' id='confirmPassword' value={form.confirmPassword} onChange={handleChange} placeholder='Confirm Password' required />
            </div>

            <div className='loyalty-field'>
              <input 
                type='checkbox' 
                id='isLoyaltyMember' 
                checked={form.isLoyaltyMember} 
                onChange={handleChange} 
              />
              <label htmlFor='isLoyaltyMember' style={{ cursor: 'pointer' }}>Join loyalty program</label>
            </div>

            <button type="submit" className="login-button">Sign Up</button>

            <div className='sign-in'>
              <p>
                Already have an account?{' '}
                <button type="button" onClick={onSwitch} className="switch-btn">
                  Sign In.
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;