import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import './clubdetails.css';
import API_BASE_URL from "../../api"; 

const defaultImage = 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80';

const ClubDetail = () => {
  const { club_id } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClub = useCallback(async () => {
    try {
      console.log(`Fetching club details from ${API_BASE_URL}/api/clubs/details/${club_id}`);
      const response = await axios.get(`${API_BASE_URL}/api/clubs/details/${club_id}`, {
        withCredentials: true,
      });
      console.log('Club details fetched:', response.data);
      const data = response.data;

      // Validate response
      if (!data || typeof data !== 'object' || !data.club_id) {
        throw new Error('Invalid club data');
      }

      // Set default values
      setClub({
        ...data,
        image: data.image_url || defaultImage,
        tagline: data.tagline || 'Join us to explore and grow together!',
        social_media: data.social_media || {}, // Empty object if not provided
      });
    } catch (error) {
      console.error('Error fetching club:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load club details');
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
        <Link to="/clubs" className="clubdetail-back-link">Back to Clubs</Link>
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
                <p className="clubdetail-tagline">{club.tagline}</p>
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
            <p className="clubdetail-content-description">{club.description || 'No description available.'}</p>
            <div className="clubdetail-club-details">
              <div className="clubdetail-detail-item">
                <span className="clubdetail-detail-label">Faculty Advisor:</span>
                <span className="clubdetail-detail-value">{club.faculty_advisor || 'N/A'}</span>
              </div>
              <div className="clubdetail-detail-item">
                <span className="clubdetail-detail-label">Contact:</span>
                <span className="clubdetail-detail-value">
                  {club.poc && club.poc_phone ? (
                    <a href={`tel:${club.poc_phone}`}>{club.poc} ({club.poc_phone})</a>
                  ) : 'N/A'}
                </span>
              </div>
              <div className="clubdetail-detail-item">
                <span className="clubdetail-detail-label">Members:</span>
                <span className="clubdetail-detail-value">
                  {club.curr_allotment && club.max_vacancy ? `${club.curr_allotment}/${club.max_vacancy}` : 'N/A'}
                </span>
              </div>
            </div>
            {Object.keys(club.social_media).length > 0 && (
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