import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './studentProfile.css';
import API_BASE_URL from "./api";

const StudentProfile = () => {
  const { studentId: studentIdFromParams } = useParams();
  const navigate = useNavigate();
  console.log('[StudentProfile] studentId from params:', studentIdFromParams);

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const loggedInUserId = localStorage.getItem('userId');
  const studentId = studentIdFromParams || loggedInUserId;

  const fetchProfile = useCallback(async (id) => {
    if (!id) {
      console.log('No studentId provided and no userId in localStorage, redirecting to login');
      setError('Please log in to view your profile');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint = `/api/profile/${id}`;
      console.log(`Fetching profile from ${API_BASE_URL}${endpoint}`);
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        withCredentials: true,
      });
      console.log("Profile fetched successfully:", response.data);
      setProfile({
        ...response.data,
        student_id: response.data.student_id || response.data.user_id,
        clubs: Array.isArray(response.data.clubs) ? response.data.clubs : [],
      });
    } catch (err) {
      console.error("Error fetching profile:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || 'Please log in to view your profile';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 3000,
        style: {
          background: '#dc3545',
          color: '#fff',
          borderRadius: '8px',
        },
      });
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      console.log(`Logging out via ${API_BASE_URL}/api/auth/logout`);
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      toast.success('Logged out successfully', {
        position: 'bottom-right',
        autoClose: 2000,
      });
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err.response?.data || err.message);
      toast.error('Failed to logout. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (!isLoggedIn && !studentId) {
      console.log('User not logged in, redirecting to login');
      navigate('/login');
      return;
    }
    setProfile(null);
    fetchProfile(studentId);
  }, [studentId, fetchProfile, isLoggedIn]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={() => fetchProfile(studentId)}>
              Retry
            </button>
            {isLoggedIn && (
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            )}
            <Link to="/clubs" className="back-link">Back to Clubs</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <p>No profile data available.</p>
        <Link to="/clubs" className="back-link">Back to Clubs</Link>
      </div>
    );
  }

  const avatarLetter = profile?.name ? profile.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="profile-container fade-in">
      <header className="profile-header">
        <div className="logo-container">
          <span className="site-logo-text">HIVE by PSG TECH</span>
        </div>
        <nav className="profile-nav">
          <Link to="/clubs" className="nav-link">Back to Clubs</Link>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <h1 className="profile-title">{profile?.name ? `${profile.name}'s Profile` : 'Profile'}</h1>

      <div className="profile-content">
        <div className="avatar-container">
          <div className="avatar">{avatarLetter}</div>
        </div>
        <div className="details-container">
          <div className="detail-card slide-in">
            <h2 className="section-title">Personal Details</h2>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{profile?.name ?? 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Student ID:</span>
              <span className="detail-value">{profile?.student_id ?? 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{profile?.email ?? 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Department:</span>
              <span className="detail-value">{profile?.dept ?? 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Class:</span>
              <span className="detail-value">{profile?.class ?? 'N/A'}</span>
            </div>
          </div>

          <div className="detail-card slide-in">
            <h2 className="section-title">Club Memberships</h2>
            {Array.isArray(profile?.clubs) && profile.clubs.length > 0 ? (
              <table className="club-table">
                <thead>
                  <tr>
                    <th>Club Name</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.clubs.map((club, index) => (
                    <tr key={club?.club_id || `club-${index}`}>
                      <td>{club?.club_name ?? 'N/A'}</td>
                      <td>{club?.type ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No club memberships found.</p>
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default StudentProfile;