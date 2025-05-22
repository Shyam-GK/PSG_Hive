// src/api.js
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "process.env.REACT_APP_API_URL" // Replace with your production backend URL
    : "http://localhost:5000";

export default API_BASE_URL;
