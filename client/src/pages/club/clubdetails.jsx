import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './clubdetails.css';

const ClubDetail = () => {
  const { club_id } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClub = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${club_id}`);
      if (!response.ok) throw new Error('Club not found');
      const data = await response.json();
      if (!data.image) {
        data.image = 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80';
      }
      setClub(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [club_id]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('clubdetail-reveal');
          }
        });
      },
      { threshold: 0.2 }
    );

    const elements = document.querySelectorAll('.clubdetail-club-details, .clubdetail-social-links');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [club]);

  if (loading) {
    return (
      <div className="clubdetail-club-detail-container">
        <div className="clubdetail-loader">Loading...</div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="clubdetail-club-detail-container">
        <p>{error || 'Club not found.'}</p>
      </div>
    );
  }

  return (
    <div className="clubdetail-wrapper">
      <div className="clubdetail-club-profile-wrapper">


        {/* Header Section */}
        <section className="clubdetail-about-section" aria-label="About the Club">
          <div className="clubdetail-club-header" style={{ backgroundImage: `url(${club.image})` }}>
            <div className="clubdetail-header-overlay"></div>
            <div className="clubdetail-header-content">
              <div className="clubdetail-hero-text">
                <h1>{club.club_name}</h1>
                <p className="clubdetail-tagline">{club.tagline || 'Join us to explore and grow together!'}</p>
              </div>
              <div className="clubdetail-club-logo">
                <div className="clubdetail-logo-wrapper">
                  <img src={club.image} alt={`${club.club_name} logo`} />
                  <div className="clubdetail-logo-glow"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="clubdetail-club-content">
            <h2 className="clubdetail-content-title">About {club.club_name}</h2>
            <p className="clubdetail-content-description">{club.description}</p>
            <div className="clubdetail-club-details">
              <div className="clubdetail-detail-item">
                <span className="clubdetail-detail-label">Faculty Advisor:</span>
                <span className="clubdetail-detail-value">{club.faculty_advisor}</span>
              </div>
              <div className="clubdetail-detail-item">
                <span className="clubdetail-detail-label">Contact:</span>
                <span className="clubdetail-detail-value">
                  <a href={`tel:${club.poc_phone}`}>{club.poc} ({club.poc_phone})</a>
                </span>
              </div>
              <div className="clubdetail-detail-item">
                <span className="clubdetail-detail-label">Members:</span>
                <span className="clubdetail-detail-value">{club.curr_allotment}/{club.max_vacancy}</span>
              </div>
            </div>
            {club.social_media && (
              <div className="clubdetail-social-links">
                {club.social_media.twitter && (
                  <a href={club.social_media.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <i className="fab fa-twitter"></i> Twitter
                  </a>
                )}
                {club.social_media.instagram && (
                  <a href={club.social_media.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <i className="fab fa-instagram"></i> Instagram
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

ClubDetail.propTypes = {
  club_id: PropTypes.string,
};

export default React.memo(ClubDetail);