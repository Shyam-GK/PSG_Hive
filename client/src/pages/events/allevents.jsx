import React, { useEffect, useRef, useState } from 'react';
import './allevents.css';

const defaultEventImage = 'https://via.placeholder.com/800x800.png?text=No+Image';
const defaultClubLogo = 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80';

const AllEvents = () => {
  const eventRefs = useRef([]);
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events from backend API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events/all');
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        let data = await response.json();

        // If club_name is missing, fetch it for each event
        const eventsWithClubNames = await Promise.all(
          data.map(async (event) => {
            if (!event.club_name) {
              try {
                const clubResponse = await fetch(`http://localhost:5000/api/events/club-name/${event.club_id}`);
                if (clubResponse.ok) {
                  const clubData = await clubResponse.json();
                  return { ...event, club_name: clubData.club_name };
                }
              } catch (err) {
                console.error(`Error fetching club name for club_id ${event.club_id}:`, err.message);
              }
            }
            return event;
          })
        );

        setEvents(eventsWithClubNames);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filter events by search and sort by start date/time
  const filteredEvents = events
    .filter(event => event.event_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  // Intersection Observer for animation
  useEffect(() => {
    eventRefs.current = eventRefs.current.slice(0, filteredEvents.length);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ae-in-view');
          }
        });
      },
      { threshold: 0.1 }
    );

    eventRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      eventRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [filteredEvents]);

  // Image error handlers
  const handleImgError = e => {
    if (e.target.src !== defaultEventImage) {
      e.target.src = defaultEventImage;
    }
  };

  const handleClubLogoError = e => {
    if (e.target.src !== defaultClubLogo) {
      e.target.src = defaultClubLogo;
    }
  };

  if (loading) return <div className="ae-loading">Loading events...</div>;
  if (error) return <div className="ae-error">Error: {error}</div>;

  return (
    <div className="ae-all-events-container">
      <div className="ae-header-section">
        <h1>EVENTS</h1>
      </div>

      <div className="ae-search-bar-container">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="ae-event-list-vertical">
        {filteredEvents.length === 0 ? (
          <div className="ae-no-results">No events found.</div>
        ) : (
          filteredEvents.map((event, index) => (
            <div
              key={event.event_id}
              className="ae-event-card"
              ref={el => (eventRefs.current[index] = el)}
            >
              <img
                src={event.image || defaultEventImage}
                alt={event.event_name}
                className="ae-event-image"
                onError={handleImgError}
              />
              <div className="ae-event-info">
                <h3>{event.event_name}</h3>
                <p>{event.event_desc}</p>
                <p><strong>Start:</strong> {new Date(event.start_datetime).toLocaleString()}</p>
                <p><strong>End:</strong> {new Date(event.end_datetime).toLocaleString()}</p>
              </div>
              <div className="ae-club-info">
                <img
                  src={event.club_logo || defaultClubLogo}
                  alt={event.club_name || 'Club Logo'}
                  className="ae-club-logo"
                  onError={handleClubLogoError}
                />
                <div className="ae-club-name">{event.club_name || 'Unknown Club'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllEvents;