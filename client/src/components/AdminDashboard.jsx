import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import "../styles/AdminDashboard.css";
import API_BASE_URL from "../api";

const AdminDashboard = () => {
  const [clubStatus, setClubStatus] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updateVacancy, setUpdateVacancy] = useState({});
  const [advisorPoC, setAdvisorPoC] = useState({});
  const [newFaculty, setNewFaculty] = useState({
    user_id: "",
    name: "",
    email: "",
    dept: "",
  });
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [showUploadUsers, setShowUploadUsers] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [joiningYears, setJoiningYears] = useState([]);
  const [selectedJoiningYear, setSelectedJoiningYear] = useState("");

  const currentYear = new Date().getFullYear();

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, { withCredentials: true });
      console.log("Fetched users for dropdown:", response.data);
      setUsers(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
      setError("Failed to load users for faculty advisor selection.");
      setUsers([]);
    }
  };

  const fetchClubStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/club-status`, { withCredentials: true });
      console.log("Club status response:", response.data);
      setClubStatus(Array.isArray(response.data.data) ? response.data.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching club status:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load club status. Please try again.");
      setClubStatus([]);
      setLoading(false);
    }
  };

  const fetchJoiningYears = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/joining-years`, { withCredentials: true });
      console.log("Joining years response:", response.data);
      setJoiningYears(Array.isArray(response.data.data) ? response.data.data : response.data);
    } catch (err) {
      console.error("Error fetching joining years:", err.response?.data || err.message);
      setError("Failed to load joining years.");
      setJoiningYears([]);
    }
  };

  useEffect(() => {
    fetchClubStatus();
    fetchUsers();
    fetchJoiningYears();
  }, []);

  const handleVacancyChange = (clubId, value) => {
    setUpdateVacancy({ ...updateVacancy, [clubId]: value });
  };

  const handleUpdateVacancy = async (clubId) => {
    const maxVacancy = updateVacancy[clubId];
    if (!maxVacancy || maxVacancy <= 0) {
      alert("Please enter a valid max vacancy (positive integer).");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/admin/update-vacancy/${clubId}`,
        { max_vacancy: parseInt(maxVacancy) },
        { withCredentials: true }
      );
      alert("Max vacancy updated successfully!");
      fetchClubStatus();
    } catch (err) {
      console.error("Error updating vacancy:", err.response?.data || err.message);
      alert(`Failed to update vacancy: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAdvisorPoCChange = (clubId, field, value) => {
    setAdvisorPoC((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        [field]: value,
      },
    }));
  };

  const handleUpdateAdvisorPoC = async (clubId) => {
    const data = advisorPoC[clubId] || {};
    const { faculty_advisor, poc, poc_phone } = data;

    if (!faculty_advisor) {
      alert("Please select a Faculty Advisor.");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/admin/update-advisor-poc/${clubId}`,
        { faculty_advisor, poc, poc_phone },
        { withCredentials: true }
      );
      alert("Faculty Advisor and PoC updated successfully!");
      fetchClubStatus();
    } catch (err) {
      console.error("Error updating advisor and PoC:", err.response?.data || err.message);
      alert(`Failed to update advisor and PoC: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleFacultyInputChange = (e) => {
    const { name, value } = e.target;
    setNewFaculty((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddFaculty = async () => {
    const { user_id, name, email, dept } = newFaculty;
    if (!user_id || !name || !email || !dept) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/admin/add-faculty`,
        {
          user_id,
          name,
          email,
          password: "anydummy password",
          dept,
          role: "faculty",
        },
        { withCredentials: true }
      );
      alert("Faculty added successfully!");
      setNewFaculty({ user_id: "", name: "", email: "", dept: "" });
      fetchUsers();
      setShowAddFaculty(false);
    } catch (err) {
      console.error("Error adding faculty:", err.response?.data || err.message);
      alert(`Failed to add faculty: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [".csv", ".xlsx", ".xls"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError("Please upload a CSV or Excel file (.csv, .xlsx, .xls).");
      return;
    }

    setUploadError(null);
    setUploadResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const parsedData = result.data;
        const requiredFields = ["user_id", "name", "email", "password", "dept"];
        const missingFields = parsedData.some((row) =>
          requiredFields.some((field) => !row[field] || row[field].trim() === "")
        );

        if (missingFields) {
          setUploadError("CSV/Excel file must contain all required fields: user_id, name, email, password, dept.");
          return;
        }

        try {
          const response = await axios.post(
            `${API_BASE_URL}/admin/upload-users`,
            parsedData,
            { withCredentials: true }
          );
          setUploadResult(response.data);
          setShowUploadUsers(false);
        } catch (err) {
          console.error("Error uploading users:", err.response?.data || err.message);
          setUploadError(`Failed to upload users: ${err.response?.data?.message || err.message}`);
        }
      },
      error: (err) => {
        setUploadError("Error parsing the file: " + err.message);
      },
    });
  };

  const handleUpdateRegistration = async (isOpen) => {
    if (!selectedJoiningYear) {
      alert("Please select a joining year.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/admin/update-registration`,
        { year_of_joining: parseInt(selectedJoiningYear), is_open: isOpen },
        { withCredentials: true }
      );
      alert(`Registration ${isOpen ? "opened" : "closed"} for joining year ${selectedJoiningYear}!`);
    } catch (err) {
      console.error("Error updating registration:", err.response?.data || err.message);
      alert(`Failed to update registration: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-heading">
          <span className="logo-text">HIVE by PSG TECH</span>
        </div>
        <div className="header-right"></div>
      </header>

      <h1 className="dashboard-title">Admin Dashboard</h1>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchClubStatus}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="club-status-section fade-in">
            <h2 className="section-title">Club Status</h2>
            <div className="club-status-cards">
              {clubStatus.length === 0 ? (
                <p>No clubs available.</p>
              ) : (
                clubStatus.map((club) => (
                  <div className="club-status-card" key={club.club_id}>
                    <h3 className="club-name">{club.club_name}</h3>
                    <p className="status-detail">Max Vacancy: {club.max_vacancy}</p>
                    <p className="status-detail">Current Allotment: {club.curr_allotment}</p>
                    <p className="status-detail">Seats Left: {club.seats_left}</p>
                    <div className="update-vacancy">
                      <input
                        type="number"
                        placeholder="New Max Vacancy"
                        value={updateVacancy[club.club_id] || ""}
                        onChange={(e) => handleVacancyChange(club.club_id, e.target.value)}
                        className="vacancy-input"
                        min="1"
                      />
                      <button
                        className="update-button"
                        onClick={() => handleUpdateVacancy(club.club_id)}
                      >
                        Update
                      </button>
                    </div>
                    <div className="advisor-poc-section">
                      <p className="status-detail">
                        Faculty Advisor: {club.faculty_advisor || "Not Set"}
                      </p>
                      <p className="status-detail">PoC: {club.poc || "Not Set"}</p>
                      <p className="status-detail">
                        PoC Phone: {club.poc_phone || "Not Set"}
                      </p>
                      <div className="update-advisor-poc">
                        <select
                          value={
                            advisorPoC[club.club_id]?.faculty_advisor ||
                            club.faculty_advisor ||
                            ""
                          }
                          onChange={(e) =>
                            handleAdvisorPoCChange(club.club_id, "faculty_advisor", e.target.value)
                          }
                          className="advisor-select"
                        >
                          <option value="">Select Faculty Advisor</option>
                          {users.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                              {user.name} ({user.user_id}) - {user.dept}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="PoC Name"
                          value={advisorPoC[club.club_id]?.poc || club.poc || ""}
                          onChange={(e) =>
                            handleAdvisorPoCChange(club.club_id, "poc", e.target.value)
                          }
                          className="poc-input"
                        />
                        <input
                          type="text"
                          placeholder="PoC Phone (10 digits)"
                          value={advisorPoC[club.club_id]?.poc_phone || club.poc_phone || ""}
                          onChange={(e) =>
                            handleAdvisorPoCChange(club.club_id, "poc_phone", e.target.value)
                          }
                          className="poc-input"
                        />
                        <button
                          className="update-button"
                          onClick={() => handleUpdateAdvisorPoC(club.club_id)}
                        >
                          Update Advisor & PoC
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="add-faculty-button-section fade-in">
            <h2 className="section-title">Add Faculty</h2>
            <button
              className="nav-button"
              onClick={() => setShowAddFaculty(!showAddFaculty)}
            >
              {showAddFaculty ? "Hide Add Faculty Form" : "Add Faculty"}
            </button>
          </section>

          {showAddFaculty && (
            <section className="add-faculty-section fade-in">
              <div className="add-faculty-form">
                <input
                  type="text"
                  name="user_id"
                  placeholder="Roll No (User ID)"
                  value={newFaculty.user_id}
                  onChange={handleFacultyInputChange}
                  className="faculty-input"
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={newFaculty.name}
                  onChange={handleFacultyInputChange}
                  className="faculty-input"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newFaculty.email}
                  onChange={handleFacultyInputChange}
                  className="faculty-input"
                />
                <input
                  type="text"
                  name="dept"
                  placeholder="Department"
                  value={newFaculty.dept}
                  onChange={handleFacultyInputChange}
                  className="faculty-input"
                />
                <button className="add-button" onClick={handleAddFaculty}>
                  Add Faculty
                </button>
              </div>
            </section>
          )}

          <section className="upload-users-button-section fade-in">
            <h2 className="section-title">Upload Students</h2>
            <button
              className="nav-button"
              onClick={() => setShowUploadUsers(!showUploadUsers)}
            >
              {showUploadUsers ? "Hide Upload Students Form" : "Upload Students"}
            </button>
          </section>

          {showUploadUsers && (
            <section className="upload-users-section fade-in">
              <div className="upload-users-form">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <p className="upload-instruction">
                  File must contain: user_id, name, email, password, dept, class (optional), role (optional), year_of_joining.
                </p>
                {uploadError && <p className="error-message">{uploadError}</p>}
                {uploadResult && (
                  <div className="upload-result">
                    <p>Upload completed:</p>
                    <p>Successful: {uploadResult.successful.length} users</p>
                    {uploadResult.failed.length > 0 && (
                      <>
                        <p>Failed: {uploadResult.failed.length} users</p>
                        <ul>
                          {uploadResult.failed.map((failed, index) => (
                            <li key={index}>
                              User ID {failed.user_id}: {failed.error}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="registration-control-section fade-in">
            <h2 className="section-title">Enable Registration</h2>
            <div className="registration-control-form">
              <select
                value={selectedJoiningYear}
                onChange={(e) => setSelectedJoiningYear(e.target.value)}
                className="passout-year-select"
              >
                <option value="">Select Year of Joining</option>
                {joiningYears.map((year) => (
                  <option key={year} value={year}>
                    {year}{" "}
                    {year === currentYear
                      ? "(Current Batch)"
                      : year > currentYear
                      ? `(Incoming Batch ${year})`
                      : `(Year ${currentYear - year})`}
                  </option>
                ))}
              </select>
              <div className="registration-buttons">
                <button
                  className="nav-button"
                  onClick={() => handleUpdateRegistration(true)}
                >
                  Open Registration
                </button>
                <button
                  className="nav-button"
                  onClick={() => handleUpdateRegistration(false)}
                  style={{ marginLeft: "10px" }}
                >
                  Close Registration
                </button>
              </div>
            </div>
          </section>

          <section className="navigation-buttons fade-in">
            <h2 className="section-title">View Reports</h2>
            <div className="button-group">
              <Link to="/admin/club-summary" className="nav-button">
                View Club Summary
              </Link>
              <Link to="/admin/users-allotments" className="nav-button">
                View Users and Allotments
              </Link>
              <Link to="/admin/users-not-registered" className="nav-button">
                View Users Not Registered
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;