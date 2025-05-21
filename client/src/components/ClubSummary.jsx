import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const ClubSummary = () => {
  const [clubSummary, setClubSummary] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterInputs, setFilterInputs] = useState({
    total_available_min: '',
    total_available_max: '',
    total_allocated_min: '',
    total_allocated_max: '',
    seats_left_min: '',
    seats_left_max: '',
  });
  const [ranges, setRanges] = useState({
    total_available: { min: 0, max: 0 },
    total_allocated: { min: 0, max: 0 },
    seats_left: { min: 0, max: 0 },
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchClubSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/admin/club-summary', { withCredentials: true });
      const data = response.data;
      setClubSummary(data);
      setFilteredData(data);

      // Compute min and max for numeric columns
      const totalAvailableValues = data.map(item => item.total_available);
      const totalAllocatedValues = data.map(item => item.total_allocated);
      const seatsLeftValues = data.map(item => item.seats_left);

      setRanges({
        total_available: {
          min: Math.min(...totalAvailableValues),
          max: Math.max(...totalAvailableValues),
        },
        total_allocated: {
          min: Math.min(...totalAllocatedValues),
          max: Math.max(...totalAllocatedValues),
        },
        seats_left: {
          min: Math.min(...seatsLeftValues),
          max: Math.max(...seatsLeftValues),
        },
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching club summary:", err.response?.data || err.message);
      setError('Failed to load club summary. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubSummary();
  }, []);

  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const filtered = clubSummary.filter((club) => {
      const totalAvailableMin = filterInputs.total_available_min ? parseInt(filterInputs.total_available_min) : -Infinity;
      const totalAvailableMax = filterInputs.total_available_max ? parseInt(filterInputs.total_available_max) : Infinity;
      const totalAllocatedMin = filterInputs.total_allocated_min ? parseInt(filterInputs.total_allocated_min) : -Infinity;
      const totalAllocatedMax = filterInputs.total_allocated_max ? parseInt(filterInputs.total_allocated_max) : Infinity;
      const seatsLeftMin = filterInputs.seats_left_min ? parseInt(filterInputs.seats_left_min) : -Infinity;
      const seatsLeftMax = filterInputs.seats_left_max ? parseInt(filterInputs.seats_left_max) : Infinity;

      return (
        club.total_available >= totalAvailableMin &&
        club.total_available <= totalAvailableMax &&
        club.total_allocated >= totalAllocatedMin &&
        club.total_allocated <= totalAllocatedMax &&
        club.seats_left >= seatsLeftMin &&
        club.seats_left <= seatsLeftMax
      );
    });
    setFilteredData(filtered);
  };

  const downloadCSV = () => {
    const headers = ['Club Name,Total Available,Total Allocated,Seats Left'];
    const rows = filteredData.map(club =>
      `${club.club_name},${club.total_available},${club.total_allocated},${club.seats_left}`
    );
    const csvContent = [...headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'club_summary.csv';
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

      <h1 className="dashboard-title">Club Summary</h1>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchClubSummary}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <section className="club-summary-section fade-in">
          <div className="filter-section">
            <div className="range-filter">
              <label>Total Available:</label>
              <input
                type="number"
                name="total_available_min"
                placeholder={`Min (${ranges.total_available.min})`}
                value={filterInputs.total_available_min}
                onChange={handleFilterInputChange}
                className="filter-input"
                min={ranges.total_available.min}
                max={ranges.total_available.max}
              />
              <input
                type="number"
                name="total_available_max"
                placeholder={`Max (${ranges.total_available.max})`}
                value={filterInputs.total_available_max}
                onChange={handleFilterInputChange}
                className="filter-input"
                min={ranges.total_available.min}
                max={ranges.total_available.max}
              />
            </div>
            <div className="range-filter">
              <label>Total Allocated:</label>
              <input
                type="number"
                name="total_allocated_min"
                placeholder={`Min (${ranges.total_allocated.min})`}
                value={filterInputs.total_allocated_min}
                onChange={handleFilterInputChange}
                className="filter-input"
                min={ranges.total_allocated.min}
                max={ranges.total_allocated.max}
              />
              <input
                type="number"
                name="total_allocated_max"
                placeholder={`Max (${ranges.total_allocated.max})`}
                value={filterInputs.total_allocated_max}
                onChange={handleFilterInputChange}
                className="filter-input"
                min={ranges.total_allocated.min}
                max={ranges.total_allocated.max}
              />
            </div>
            <div className="range-filter">
              <label>Seats Left:</label>
              <input
                type="number"
                name="seats_left_min"
                placeholder={`Min (${ranges.seats_left.min})`}
                value={filterInputs.seats_left_min}
                onChange={handleFilterInputChange}
                className="filter-input"
                min={ranges.seats_left.min}
                max={ranges.seats_left.max}
              />
              <input
                type="number"
                name="seats_left_max"
                placeholder={`Max (${ranges.seats_left.max})`}
                value={filterInputs.seats_left_max}
                onChange={handleFilterInputChange}
                className="filter-input"
                min={ranges.seats_left.min}
                max={ranges.seats_left.max}
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
                <th>Club Name</th>
                <th>Total Available</th>
                <th>Total Allocated</th>
                <th>Seats Left</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((club) => (
                <tr key={club.club_id}>
                  <td>{club.club_name}</td>
                  <td>{club.total_available}</td>
                  <td>{club.total_allocated}</td>
                  <td>{club.seats_left}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default ClubSummary;