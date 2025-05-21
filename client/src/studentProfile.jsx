import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './studentProfile.css';

const StudentProfile = () => {
  const { studentId } = useParams();
  console.log('[StudentProfile] studentId from params:', studentId);

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchTimestamp, setFetchTimestamp] = useState(null);

  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log("Fetching user details from http://localhost:5000/student/me...");
      const response = await axios.get('http://localhost:5000/student/me', {
        withCredentials: true,
      });
      console.log("User details fetched successfully:", response.data);
      const fetchedStudentId = response.data.student_id;
      if (fetchedStudentId) {
        // Call fetchProfile with the student_id to get the full profile including clubs
        await fetchProfile(fetchedStudentId);
      } else {
        setProfile(response.data);
        setFetchTimestamp(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      }
      return true;
    } catch (err) {
      console.error("Error fetching user details:", err.response?.data || err.message);
      const errorMessage = `Failed to load user details: ${err.response?.data?.message || err.message}. Please try logging in again.`;
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
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (id) => {
    setLoading(true);
    setError('');
    try {
      console.log(`Fetching profile for studentId: ${id}`);
      const response = await axios.get(`http://localhost:5000/api/profile/${id}`, {
        withCredentials: true,
      });
      console.log("Profile fetched successfully:", response.data);
      setProfile(response.data);
      setFetchTimestamp(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    } catch (err) {
      console.error("Error fetching profile:", err.response?.data || err.message);
      const errorMessage = `Failed to fetch profile: ${err.response?.data?.message || err.message}`;
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setProfile(null);
      if (studentId) {
        console.log('[useEffect] Fetching profile for studentId:', studentId);
        await fetchProfile(studentId);
      } else {
        console.log('[useEffect] No student ID in params, fetching from /student/me');
        await fetchUserDetails();
      }
    };

    initialize();
  }, [studentId, fetchProfile, fetchUserDetails]);

  useEffect(() => {
    console.log("Profile state updated:", profile);
  }, [profile]);

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
          {error}
          <button className="retry-button" onClick={() => (studentId ? fetchProfile(studentId) : fetchUserDetails())}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        No profile data available.
        <pre>Profile: {JSON.stringify(profile, null, 2)}</pre>
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
      </header>

      <h1 className="profile-title">{profile?.name ? `${profile.name}'s Profile` : 'Profile'}</h1>

      <div className="profile-content">
        <div className="avatar-container">
          <div className="avatar">{avatarLetter}</div>
        </div>
        <div className="details-container">
          <div className="detail-card">
            <h2 className="section-title">Personal Details</h2>
            
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{profile?.name ?? 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Student ID:</span>
              <span className="detail-value">{profile?.student_id ?? profile?.user_id ?? 'N/A'}</span>
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

          <div className="detail-card">
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
                  {profile.clubs.map((club) => (
                    <tr key={club?.club_id ?? club?.club_name ?? Math.random()}>
                      
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