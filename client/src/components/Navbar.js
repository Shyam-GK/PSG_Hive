import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../pages/auth/psgtech.png';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../index.css';
import API_BASE_URL from "../api"; 

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('isLoggedIn'));
  const [role, setRole] = useState(localStorage.getItem('role') || 'student');

  useEffect(() => {
    const checkAuthState = () => {
      const loggedIn = localStorage.getItem('isLoggedIn');
      const userRole = localStorage.getItem('role') || 'student';
      setIsLoggedIn(loggedIn === 'true');
      setRole(userRole);
    };

    checkAuthState();
    const interval = setInterval(checkAuthState, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });

      if (response.data.success) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');

        toast.success('Logged out successfully!', {
          position: 'top-right',
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: '#28a745',
            color: '#fff',
            borderRadius: '8px',
          },
        });

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        throw new Error('Logout failed on server');
      }
    } catch (err) {
      console.error('Logout error:', err);

      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');

      toast.error('Logout failed, but session cleared. Redirecting...', {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#dc3545',
          color: '#fff',
          borderRadius: '8px',
        },
      });

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="Logo" width="250" height="100" />
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        {isLoggedIn ? (
          <>

            <li>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/forgot-password">Forgot Password</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;