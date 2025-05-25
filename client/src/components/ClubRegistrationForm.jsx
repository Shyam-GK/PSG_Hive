import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ClubRegistrationForm.css';
import API_BASE_URL from "../api";

const maxClubsAllowed = 1;

const ClubRegistrationForm = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch registration status
        console.log(`Fetching registration status from ${API_BASE_URL}/student/registration-status`);
        const statusResponse = await axios.get(`${API_BASE_URL}/student/registration-status`, {
          withCredentials: true,
        });
        console.log("Registration status:", statusResponse.data);
        setRegistrationStatus(statusResponse.data);

        if (!statusResponse.data.canRegister) {
          setError('Registration is closed or you have already registered.');
          setLoading(false);
          return;
        }

        // Fetch available clubs
        console.log(`Fetching clubs from ${API_BASE_URL}/student/available-clubs`);
        const clubsResponse = await axios.get(`${API_BASE_URL}/student/available-clubs`, {
          withCredentials: true,
        });
        console.log("Clubs fetched:", clubsResponse.data);
        setClubs(clubsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err.message);
        const errorMessage = err.response?.data?.error || 'Failed to load registration data';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'bottom-right',
          autoClose: 3000,
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRegister = (clubId, clubName) => {
    if (applications.length >= maxClubsAllowed) {
      toast.error(`You can only select ${maxClubsAllowed} clubs.`, {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }
    if (applications.find((app) => app.clubId === clubId)) {
      toast.error('This club is already selected.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
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
    if (applications.length !== maxClubsAllowed) {
      toast.error(`Please select exactly ${maxClubsAllowed} clubs.`, {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmission = async () => {
    try {
      const preferences = applications.map((app) => app.clubId);
      console.log(`Submitting preferences to ${API_BASE_URL}/student/register-club:`, preferences);
      const response = await axios.post(
        `${API_BASE_URL}/student/register-club`,
        { preferences },
        { withCredentials: true }
      );
      console.log("Submission response:", response.data);
      toast.success('Registration submitted successfully!', {
        position: 'bottom-right',
        autoClose: 2000,
      });
      setApplications([]);
      setShowConfirm(false);
      navigate('/');
    } catch (err) {
      console.error("Submission error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || 'Failed to submit preferences';
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 3000,
      });
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !registrationStatus?.canRegister) {
    return (
      <div className="app-container">
        <header className="form-header">
          <span className="logo-text">HIVE by PSG TECH</span>
        </header>
        <div className="error-message">
          <p>{error || 'You cannot register at this time.'}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="form-header">
        <span className="logo-text">HIVE by PSG TECH</span>
      </header>
      <h1 className="form-title">Club Registration Form</h1>

      <div className="application-counter">
        <span>Clubs Left to Select: {maxClubsAllowed - applications.length}</span>
      </div>

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
                  club.seats_left === 0 ||
                  applications.length >= maxClubsAllowed
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

      {applications.length > 0 && (
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

      {applications.length > 0 && (
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

      <ToastContainer />
    </div>
  );
};

export default ClubRegistrationForm;