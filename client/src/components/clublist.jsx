import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './clublist.css';

const defaultImage = 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80';

const ClubList = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [visibleCards, setVisibleCards] = useState([]);
  const observer = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/clubs/all')
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Fetched club data:', data);
        const updatedClubs = data.map(club => ({
          ...club,
          description: club.description === 'NULL' ? 'No description available.' : club.description,
          image: defaultImage, // You can conditionally override here if needed
        }));
        setClubs(updatedClubs);
      })
      .catch(err => console.error('Failed to fetch clubs:', err));
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

    return () => observer.current.disconnect();
  }, [clubs]);

  const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return value;
    }
    return null;
  };

  const handleExplore = (club_id) => {
    const isLoggedIn = getCookie('isLoggedIn');
    if (isLoggedIn === 'true') {
      navigate(`/clubs/${club_id}`);
    } else {
      alert('Please login to explore club details.');
      navigate('/login');
    }
  };

  return (
    <div className="clubs-container">
      <h2 className="clubs-heading">Discover Clubs</h2>
      <div className="clubs-grid">
        {clubs.map((club, index) => (
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
        ))}
      </div>
    </div>
  );
};

export default ClubList;
