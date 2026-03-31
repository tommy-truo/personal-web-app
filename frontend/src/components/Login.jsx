import React, {useState} from 'react';
import './Login.css'
import InputField from './InputField.jsx';



const Login = ({onLoginSuccess, onSwitch}) => {
    const [formData, setFormData] = useState({ email: '', password: '' });

    
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const response = await fetch('http://localhost:5001/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
          });

          const data = await response.json();

          if (response.ok) {
              //alert("Login Successful!");
              onLoginSuccess(data); // Pass user data to parent component
          } else {
              alert("Login Failed: " + data.message);
          }







      } catch (err) {
          console.error("Login Error:", err);
          alert("Connection error. Is the backend running?");
      }
  };




    // Page layout
    return (

    //navbar
      <div className='login-page'>
        <div className="light-red-page"> 
          <nav className="navbar navbar-expand-lg navbar-light-red" data-bs-theme>
            <div className="container-fluid">
              <a className="navbar-brand brand-text" href="#">
              <img 
                src="acmelogo.png"
                alt="logo"
                className="navbar-logo me-2"
                />ACME Airlines
                </a>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
              </button>
            </div>
          </nav>
        </div>


        {/* Login Form */}
        <div className='form-wrapper'>
          <div className='login-container'>
          <form onSubmit={handleSubmit}> 
            <h2 className='form-title'>Login</h2>

            <InputField
                label="ACME Email" 
                type="email" 
                id="email" 
                placeholder="example@acmeairlines.com"
                onChange={handleChange}
            />

            <InputField
                label="Password" 
                type="password" 
                id="password" 
                placeholder="**********"
                onChange={handleChange}
            /> 
              
              <button type="submit" className="signup-button">Sign In</button>

              <div className='sign-up'>
              <p>
                Don't have an account?
                <button type="button" onClick={onSwitch} className="switch-btn">
                  Sign Up.
                </button>
              </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      );
}

export default Login;