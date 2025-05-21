import React, { useEffect, useState } from 'react';
import './events.css';
import { useNavigate } from 'react-router-dom';
import eventImage from './event.jpeg';

function EventPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/events/landing');
        const data = await res.json();
        setEvents(
          data
            .sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime))
            .slice(0, 3)
        );
        setFadeIn(true); // Trigger fade-in after events load
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="ep-container">
      <div className="ep-left">
        <img
          src={eventImage}
          alt="Event Illustration"
          className="ep-image"
        />
      </div>
      <div className="ep-right">
        <h2 className="ep-heading">Upcoming Events</h2>
        <div className="ep-events-list">
          {events.map((event, idx) => {
            const date = new Date(event.start_datetime);
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();

            return (
              <div
                key={event.event_id}
                className={`ep-event-card ${fadeIn ? 'ep-fade-in' : ''}`}
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                <div className="ep-date-box">
                  <div className="ep-date-day">{day}</div>
                  <div className="ep-date-month">{month}</div>
                </div>
                <div className="ep-event-content">
                  <h3>{event.event_name}</h3>
                  <p>{event.event_desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <button className="ep-explore-btn1" onClick={() => navigate('/all-events')}>
          Explore More Events
        </button>
      </div>
    </div>
  );
}

export default EventPage;