import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const [clubs, setClubs] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [allotment, setAllotment] = useState([]);
  const [registrationStatus, setRegistrationStatus] = useState({
    hasRegistered: false,
    canSelectClubs: true,
    isRegistrationOpen: false,
    registrationPassoutYear: null,
    userPassoutYear: null,
    canRegister: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchClubs = async () => {
    try {
      const response = await axios.get("http://localhost:5000/student/club-list", { withCredentials: true });
      setClubs(response.data);
    } catch (err) {
      console.error("Error fetching clubs:", err.response?.data || err.message);
      setError("Failed to load club list.");
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await axios.get("http://localhost:5000/student/preferences", { withCredentials: true });
      setPreferences(response.data);
    } catch (err) {
      console.error("Error fetching preferences:", err.response?.data || err.message);
      setError("Failed to load preferences.");
    }
  };

  const fetchAllotment = async () => {
    try {
      const response = await axios.get("http://localhost:5000/student/allotment", { withCredentials: true });
      setAllotment(response.data);
    } catch (err) {
      console.error("Error fetching allotment:", err.response?.data || err.message);
      setError("Failed to load allotment.");
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const response = await axios.get("http://localhost:5000/student/registration-status", { withCredentials: true });
      setRegistrationStatus(response.data);
    } catch (err) {
      console.error("Error fetching registration status:", err.response?.data || err.message);
      setError("Failed to load registration status.");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClubs(),
      fetchPreferences(),
      fetchAllotment(),
      fetchRegistrationStatus(),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-heading">
          <span className="logo-text">HIVE by PSG TECH</span>
        </div>
        <div className="header-right"></div>
      </header>

      <h1 className="dashboard-title">Student Dashboard</h1>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="registration-section fade-in">
            <h2 className="section-title">Club Registration</h2>
            {registrationStatus.hasRegistered ? (
              <p className="status-message">You have already submitted your preferences.</p>
            ) : (
              <>
                {!registrationStatus.canRegister && (
                  <p className="error-message">
                    You can't submit another preference.{" "}
                    {registrationStatus.isRegistrationOpen
                      ? "You have already registered or are not allowed to select clubs."
                      : "Registration is currently closed."}
                  </p>
                )}
                <Link to="/student/register">
                  <button
                    className="nav-button"
                    disabled={!registrationStatus.canRegister}
                  >
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </section>

          <section className="preferences-section fade-in">
            <h2 className="section-title">Your Preferences</h2>
            {preferences.length > 0 ? (
              <div className="preferences-list">
                {preferences.map((pref) => (
                  <div key={pref.pref_no} className="preference-item">
                    <p>Preference {pref.pref_no}: {pref.club_name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>You have not submitted any preferences yet.</p>
            )}
          </section>

          <section className="allotment-section fade-in">
            <h2 className="section-title">Your Allotment</h2>
            {allotment.length > 0 ? (
              <div className="allotment-list">
                {allotment.map((item, index) => (
                  <div key={index} className="allotment-item">
                    <p>Club: {item.club_name}</p>
                    <p>Type: {item.type}</p>
                    <p>Status: {item.status}</p>
                    <p>Allotted At: {new Date(item.alloted_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No allotment has been made yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;