import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AdminDashboard.css";
import API_BASE_URL from "../api";

const UsersNotRegistered = () => {
  const [usersNotRegistered, setUsersNotRegistered] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterInputs, setFilterInputs] = useState({
    dept: "",
    class: "",
    gender: "",
    residency_status: "",
  });
  const [uniqueValues, setUniqueValues] = useState({
    dept: [],
    class: [],
    gender: [],
    residency_status: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsersNotRegistered = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users-not-registered`, {
        withCredentials: true,
      });
      console.log("Users not registered response:", response.data);
      const data = response.data.data || [];

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format: Data is not an array");
      }

      setUsersNotRegistered(data);
      setFilteredData(data);

      const uniqueDepts = [...new Set(data.map((item) => item.dept))].sort();
      const uniqueClasses = [...new Set(data.map((item) => item.class || "N/A"))].sort();
      const uniqueGenders = [...new Set(data.map((item) => item.gender))].sort();
      const uniqueResidencyStatuses = [...new Set(data.map((item) => item.residency_status))].sort();

      setUniqueValues({
        dept: uniqueDepts,
        class: uniqueClasses,
        gender: uniqueGenders,
        residency_status: uniqueResidencyStatuses,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users not registered:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load users not registered. Please try again.");
      setUsersNotRegistered([]);
      setFilteredData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersNotRegistered();
  }, []);

  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const filtered = usersNotRegistered.filter((user) => {
      return (
        (filterInputs.dept ? user.dept === filterInputs.dept : true) &&
        (filterInputs.class ? (user.class || "N/A") === filterInputs.class : true) &&
        (filterInputs.gender ? user.gender === filterInputs.gender : true) &&
        (filterInputs.residency_status ? user.residency_status === filterInputs.residency_status : true)
      );
    });
    setFilteredData(filtered);
  };

  const downloadCSV = () => {
    const headers = ["User ID,Name,Department,Class,Gender,Residency Status"];
    const rows = filteredData.map(
      (user) => `${user.user_id},${user.name},${user.dept},${user.class || "N/A"},${user.gender},${user.residency_status}`
    );
    const csvContent = [...headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_not_registered.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-heading">
          <span className="logo-text">HIVE by PSG TECH</span>
        </div>
      </header>

      <h1 className="dashboard-title">Users Not Registered</h1>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchUsersNotRegistered}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <section className="users-not-registered-section fade-in">
          <div className="filter-section">
            <div className="range-filter">
              <label>Department:</label>
              <select
                name="dept"
                value={filterInputs.dept}
                onChange={handleFilterInputChange}
                className="filter-dropdown"
              >
                <option value="">All Departments</option>
                {uniqueValues.dept.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="range-filter">
              <label>Class:</label>
              <select
                name="class"
                value={filterInputs.class}
                onChange={handleFilterInputChange}
                className="filter-dropdown"
              >
                <option value="">All Classes</option>
                {uniqueValues.class.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="range-filter">
              <label>Gender:</label>
              <select
                name="gender"
                value={filterInputs.gender}
                onChange={handleFilterInputChange}
                className="filter-dropdown"
              >
                <option value="">All Genders</option>
                {uniqueValues.gender.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="range-filter">
              <label>Residency Status:</label>
              <select
                name="residency_status"
                value={filterInputs.residency_status}
                onChange={handleFilterInputChange}
                className="filter-dropdown"
              >
                <option value="">All Residency Statuses</option>
                {uniqueValues.residency_status.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <button className="apply-filters-button" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="download-button" onClick={downloadCSV}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="20"
                height="20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Download as CSV
            </button>
          </div>
          {filteredData.length === 0 ? (
            <p>No users match the applied filters.</p>
          ) : (
            <table className="summary-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Residency Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.name}</td>
                    <td>{user.dept}</td>
                    <td>{user.class || "N/A"}</td>
                    <td>{user.gender}</td>
                    <td>{user.residency_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
};

export default UsersNotRegistered;