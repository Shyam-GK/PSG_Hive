import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const UsersAllotments = () => {
  const [usersAllotments, setUsersAllotments] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterInputs, setFilterInputs] = useState({
    dept: '',
    club_name: '',
    type: '',
    status: '',
    alloted_at_start: '',
    alloted_at_end: '',
  });
  const [uniqueValues, setUniqueValues] = useState({
    dept: [],
    club_name: [],
    type: [],
    status: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsersAllotments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/admin/users-allotments', { withCredentials: true });
      const data = response.data;
      setUsersAllotments(data);
      setFilteredData(data);

      const uniqueDepts = [...new Set(data.map(item => item.dept))].sort();
      const uniqueClubNames = [...new Set(data.map(item => item.club_name))].sort();
      const uniqueTypes = [...new Set(data.map(item => item.type))].sort();
      const uniqueStatuses = [...new Set(data.map(item => item.status))].sort();

      setUniqueValues({
        dept: uniqueDepts,
        club_name: uniqueClubNames,
        type: uniqueTypes,
        status: uniqueStatuses,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users allotments:", err.response?.data || err.message);
      setError('Failed to load users allotments. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAllotments();
  }, []);

  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const filtered = usersAllotments.filter((allotment) => {
      const allotedAt = new Date(allotment.alloted_at);
      const startDate = filterInputs.alloted_at_start ? new Date(filterInputs.alloted_at_start) : null;
      const endDate = filterInputs.alloted_at_end ? new Date(filterInputs.alloted_at_end) : null;

      return (
        (filterInputs.dept ? allotment.dept === filterInputs.dept : true) &&
        (filterInputs.club_name ? allotment.club_name === filterInputs.club_name : true) &&
        (filterInputs.type ? allotment.type === filterInputs.type : true) &&
        (filterInputs.status ? allotment.status === filterInputs.status : true) &&
        (startDate ? allotedAt >= startDate : true) &&
        (endDate ? allotedAt <= endDate : true)
      );
    });
    setFilteredData(filtered);
  };

  const downloadCSV = () => {
    const headers = ['User ID,Name,Department,Club,Type,Status,Allotted At'];
    const rows = filteredData.map(allotment =>
      `${allotment.user_id},${allotment.name},${allotment.dept},${allotment.club_name},${allotment.type},${allotment.status},${new Date(allotment.alloted_at).toLocaleString()}`
    );
    const csvContent = [...headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_allotments.csv';
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

      <h1 className="dashboard-title">Users and Allotments</h1>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchUsersAllotments}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <section className="users-allotments-section fade-in">
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
              <label>Club:</label>
              <select
                name="club_name"
                value={filterInputs.club_name}
                onChange={handleFilterInputChange}
                className="filter-dropdown"
              >
                <option value="">All Clubs</option>
                {uniqueValues.club_name.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="range-filter">
              <label>Type:</label>
              <select
                name="type"
                value={filterInputs.type}
                onChange={handleFilterInputChange}
                className="filter-dropdown"
              >
                <option value="">All Types</option>
                {uniqueValues.type.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="range-filter">
              <label>Status:</label>
              <select
                name="status"
                value={filterInputs.status}
                onChange={handleFilterInputChange}
                className="filter-dropdown"
              >
                <option value="">All Statuses</option>
                {uniqueValues.status.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="range-filter">
              <label>Start Date:</label>
              <input
                type="date"
                name="alloted_at_start"
                value={filterInputs.alloted_at_start}
                onChange={handleFilterInputChange}
                className="filter-input"
              />
            </div>
            <div className="range-filter">
              <label>End Date:</label>
              <input
                type="date"
                name="alloted_at_end"
                value={filterInputs.alloted_at_end}
                onChange={handleFilterInputChange}
                className="filter-input"
              />
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
          <table className="summary-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Club</th>
                <th>Type</th>
                <th>Status</th>
                <th>Allotted At</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((allotment, index) => (
                <tr key={index} className={allotment.type === 'Primary' ? 'primary-row' : ''}>
                  <td>{allotment.user_id}</td>
                  <td>{allotment.name}</td>
                  <td>{allotment.dept}</td>
                  <td>{allotment.club_name}</td>
                  <td>{allotment.type}</td>
                  <td>{allotment.status}</td>
                  <td>{new Date(allotment.alloted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default UsersAllotments;