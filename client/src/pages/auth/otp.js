import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Otp.css';
import API_BASE_URL from "../../api"; 


const Otp = () => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [resendVisible, setResendVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from previous page state or fallback
  const email = location.state?.email || '';

  useEffect(() => {
    if (countdown <= 0) {
      setResendVisible(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!otp) {
      setMessage('❌ Please enter the OTP.');
      return;
    }

    try {
      // Call backend to verify OTP
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });

      if (res.status === 200) {
        setShowPopup(true);
        setMessage('');
        setTimeout(() => {
          setShowPopup(false);
          // Navigate to reset password page, pass email and otp
          navigate('/reset-password', { state: { email, otp } });
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || '❌ Incorrect OTP. Try again.';
      setMessage(errorMsg);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setCountdown(60);
      setResendVisible(false);
      setMessage('🔁 OTP resent successfully.');
    } catch (err) {
      setMessage('❌ Failed to resend OTP. Please try again.');
    }
  };

  return (
    <div className="otp-page">
      {showPopup && <div className="popup-message success">✅ OTP verified successfully!</div>}

      <div className="otp-container">
        <h2 className="otp-title">🔐 Verify OTP</h2>

        <div className="otp-email-box">
          <p>📩 OTP sent to:</p>
          <span className="otp-email">{email}</span>
        </div>

        <input
          type="text"
          className="otp-input"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
          maxLength={6}
        />

        <button onClick={handleVerify} className="verify-btn">
          ✅ Verify OTP
        </button>

        <p className="timer">
          ⏰ Time left:{' '}
          <span className={countdown <= 10 ? 'red-timer' : ''}>
            {countdown}s
          </span>
        </p>

        {resendVisible && (
          <p className="resend-link" onClick={handleResend} style={{ cursor: 'pointer', color: 'blue' }}>
            🔄 Resend OTP
          </p>
        )}

        {message && <p className="otp-message">{message}</p>}
      </div>
    </div>
  );
};

export default Otp;
