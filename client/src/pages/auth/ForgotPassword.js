import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';  // new import
import './LoginForm.css';
import girlImg from './girl.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const navigate = useNavigate();

  const handleReset = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: email,
    });

    if (res.data.message === 'OTP sent successfully') {
      setPopupType('success');
      setPopupMessage('✅ OTP sent successfully!');
      setTimeout(() => {
        navigate('/otp', { state: { email } });
      }, 1500);
    } else {
      setPopupType('error');
      setPopupMessage('❌ Failed to send OTP.');
      setTimeout(() => setPopupMessage(''), 3000);
    }
  } catch (err) {
    setPopupType('error');
    const message = err.response?.data?.message || 'Failed to send OTP.';
    setPopupMessage(`❌ ${message}`);
    setTimeout(() => setPopupMessage(''), 3000);
  }
};


  return (
    <div className="login-page">
      {popupMessage && (
        <div className={`popup-notification ${popupType}`}>
          {popupMessage}
        </div>
      )}

      <div className="login-container">
        <div className="login-box">
          <div className="form-section">
            <h2>Forgot Password?</h2>

            <label>Email Address</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <button className="login-btn" onClick={handleReset}>
              Get OTP
            </button>
          </div>

          <div className="image-section">
            <img
              src={girlImg}
              alt="reset password illustration"
              className="login-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
