import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './clublist.css';
import API_BASE_URL from "../api"; 
const defaultImage = 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80';

const ClubList = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [visibleCards, setVisibleCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const observer = useRef(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        console.log(`Fetching clubs from ${API_BASE_URL}/api/clubs/all`);
        const response = await axios.get(`${API_BASE_URL}/api/clubs/all`, {
          withCredentials: true,
        });
        console.log('Response status:', response.status);
        console.log('Fetched club data:', response.data);

        if (!Array.isArray(response.data)) {
          throw new Error('Unexpected response format: Data is not an array');
        }

        const updatedClubs = response.data.map(club => ({
          ...club,
          description: club.description === 'NULL' || !club.description ? 'No description available.' : club.description,
          image: club.image_url || defaultImage, // Use server-provided image if available
        }));
        setClubs(updatedClubs);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch clubs:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch clubs';
        setError(errorMessage);
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  useEffect(() => {
    if (!clubs.length) return; // Don't observe if no clubs

    observer.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleCards(prev => [...new Set([...prev, entry.target.dataset.id])]);
          }
        });
      },
      { threshold: 0.2 }
    );

    const cards = document.querySelectorAll('.club-card');
    cards.forEach(card => observer.current.observe(card));

    return () => observer.current?.disconnect();
  }, [clubs]);

  const handleExplore = (club_id) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate(`/clubs/${club_id}`);
    } else {
      alert('Please login to explore club details.');
      navigate('/login');
    }
  };

  if (loading) return <div className="clubs-container">Loading clubs...</div>;
  if (error) return <div className="clubs-container">Error: {error}</div>;

  return (
    <div className="clubs-container">
      <h2 className="clubs-heading">Discover Clubs</h2>
      <div className="clubs-grid">
        {clubs.length === 0 ? (
          <p>No clubs available.</p>
        ) : (
          clubs.map((club, index) => (
            <div
              className={`club-card ${visibleCards.includes(`${index}`) ? 'visible' : ''}`}
              key={`${club.club_id}-${index}`}
              data-id={index}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="club-image-container">
                <img src={club.image} alt={club.club_name} className="club-image" />
              </div>
              <div className="club-content">
                <h3 className="club-name">{club.club_name}</h3>
                <p className="club-description">{club.description}</p>
                <button className="explore-button2" onClick={() => handleExplore(club.club_id)}>
                  Explore More
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClubList;