import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  // Get email and verified OTP from navigation state
  const email = location.state?.email;
  const otp = location.state?.otp;

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPopupType('error');
      setPopupMessage('❌ All fields are required');
      setTimeout(() => setPopupMessage(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPopupType('error');
      setPopupMessage('❌ Passwords do not match');
      setTimeout(() => setPopupMessage(''), 3000);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      if (res.data.message === 'Password updated successfully') {
        setPopupType('success');
        setPopupMessage('✅ Password reset successful!');
        setTimeout(() => {
          setPopupMessage('');
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password';
      setPopupType('error');
      setPopupMessage(`❌ ${message}`);
      setTimeout(() => setPopupMessage(''), 3000);
    }
    console.log('ResetPassword state:', location.state);

  };

  return (
    <div className="reset-page">
      {popupMessage && (
        <div className={`popup-message ${popupType}`}>{popupMessage}</div>
      )}
      <div className="reset-container">
        <div className="reset-title">Reset Password</div>

        <label className="reset-label">New Password</label>
        <input
          type="password"
          className="reset-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />

        <label className="reset-label">Confirm Password</label>
        <input
          type="password"
          className="reset-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <button className="reset-btn" onClick={handleResetPassword}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
