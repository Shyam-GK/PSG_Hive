const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL || "https://10.1.10.181:5000"
    : "http://localhost:5000";

console.log("API_BASE_URL:", API_BASE_URL); // Debug


export default API_BASE_URL;