import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ClubRegistrationForm.css';
import API_BASE_URL from "../api"; 
const maxClubsAllowed = 3;

// Set base URL to the root of the backend
axios.defaults.baseURL = `${API_BASE_URL}`;

const ClubRegistrationForm = () => {
  const [clubs, setClubs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchUserDetails = async () => {
    try {
      console.log(`Fetching user details from ${API_BASE_URL}/student/me...`);
      const response = await axios.get(`${API_BASE_URL}/student/me`, {
        withCredentials: true,
      });
      console.log("User details fetched successfully:", response.data);
      setUser(response.data);
      return true; // Indicate success
    } catch (err) {
      console.error("Error fetching user details:", err.response?.data || err.message);
      setError(`Failed to load user details: ${err.response?.data?.message || err.message}. Please try logging in again.`);
      return false; // Indicate failure
    }
  };

  const fetchClubs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Attempting to fetch clubs from ${API_BASE_URL}/student/available-clubs...`);
      const response = await axios.get(`${API_BASE_URL}/student/available-clubs`, {
        timeout: 5000,
        withCredentials: true,
      });
      console.log("Clubs fetched successfully:", response.data);
      setClubs(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching clubs:", err.response?.data || err.message);
      if (err.response?.status === 404) {
        setError('The clubs endpoint was not found (404). Please ensure the backend is running and the route /student/available-clubs is correctly set up.');
      } else {
        setError(`Failed to load clubs: ${err.response?.data?.message || err.message}. Please try again.`);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const userFetched = await fetchUserDetails();
      if (userFetched) {
        await fetchClubs();
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const handleRegister = (clubId, clubName) => {
    if (applications.length >= maxClubsAllowed) {
      alert('You have already selected the maximum number of clubs (3).');
      return;
    }
    if (applications.find((app) => app.clubId === clubId)) {
      alert('This club is already selected.');
      return;
    }
    const newApp = {
      clubId,
      clubName,
      memberType: applications.length === 0 ? 'Primary' : 'Associate',
      preference: applications.length + 1,
    };
    setApplications([...applications, newApp]);
  };

  const handleDelete = (index) => {
    const updated = [...applications];
    updated.splice(index, 1);
    const reordered = updated.map((app, idx) => ({
      ...app,
      preference: idx + 1,
      memberType: idx === 0 ? 'Primary' : 'Associate',
    }));
    setApplications(reordered);
  };

  const handleSubmit = () => {
    if (!user) {
      alert('User details not loaded. Please try logging in again.');
      return;
    }
    if (applications.length !== maxClubsAllowed) {
      alert(`Please select exactly ${maxClubsAllowed} clubs before submitting.`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmission = async () => {
    try {
      const preferences = applications.map((app) => app.clubId);
      console.log(`Submitting registration to ${API_BASE_URL}/student/register-club:`, { preferences });
      const response = await axios.post(`${API_BASE_URL}/student/register-club`, {
        preferences,
      }, {
        withCredentials: true,
      });
      console.log("Submission response:", response.data);
      alert('Registration submitted successfully!');
      setApplications([]);
      setShowConfirm(false);
    } catch (err) {
      console.error("Submission error:", err.response?.data || err.message);
      alert(`Submission failed: ${err.response?.data?.message || err.message}`);
      setShowConfirm(false);
    }
  };

  return (
    <div className="app-container">
      <header className="form-header">
        <div className="logo-heading">
          <span className="logo-text">HIVE by PSG TECH</span>
        </div>
        <h1 className="form-title">Club Registration Form</h1>
      </header>

      <div className="application-counter">
        <span>Clubs Left to Select: {maxClubsAllowed - applications.length}</span>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading clubs...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={() => { fetchUserDetails().then((success) => { if (success) fetchClubs(); }); }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && user && (
        <div className="user-details">
          <h2>Welcome, {user.name}</h2>
          
          {user.can_select_clubs === false && (
            <p className="error-message">Registration is closed or you have already registered.</p>
          )}
        </div>
      )}

      {!loading && !error && clubs.length > 0 && user && user.can_select_clubs && (
        <section className="club-list">
          <h2 className="section-title">Available Clubs</h2>
          <div className="club-cards">
            {clubs.map((club) => (
              <div className="club-card1 fade-in" key={club.club_id}>
                <h3 className="club-name">{club.club_name}</h3>
                <p className="seats-available">Seats Available: {club.seats_left}</p>
                <button
                  className="register-button"
                  onClick={() => handleRegister(club.club_id, club.club_name)}
                  disabled={
                    applications.find((app) => app.clubId === club.club_id) ||
                    club.seats_left === 0
                  }
                >
                  {applications.find((app) => app.clubId === club.club_id)
                    ? 'Selected'
                    : club.seats_left === 0
                    ? 'No Seats'
                    : 'Register'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && clubs.length === 0 && (
        <div className="no-clubs-message">
          <p>No clubs are currently available for registration. Please contact the administrator.</p>
        </div>
      )}

      {applications.length > 0 && user && user.can_select_clubs && (
        <section className="summary-table-container fade-in">
          <h2 className="section-title">Your Selected Clubs</h2>
          <table className="summary-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Club</th>
                <th>Type</th>
                <th>Preference</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr key={index} className={app.memberType === 'Primary' ? 'primary-row' : ''}>
                  <td>{index + 1}</td>
                  <td>{app.clubName}</td>
                  <td>{app.memberType}</td>
                  <td>{app.preference}</td>
                  <td>
                    <button className="delete-button" onClick={() => handleDelete(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {applications.length > 0 && user && user.can_select_clubs && (
        <div className="submit-button-container">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={applications.length !== maxClubsAllowed}
          >
            Submit Preferences
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h3 className="dialog-title">Confirm Your Preferences</h3>
            <p>Are you sure you want to submit the following club preferences?</p>
            <ul className="dialog-list">
              {applications.map((app, index) => (
                <li key={index}>
                  {index + 1}. {app.clubName} ({app.memberType})
                </li>
              ))}
            </ul>
            <div className="dialog-buttons">
              <button className="confirm-button" onClick={confirmSubmission}>
                Confirm
              </button>
              <button className="cancel-button" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubRegistrationForm;