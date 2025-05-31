import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./LandingPage.css";
import ClubList from "../components/clublist";
import EventCard from "../components/events";
import ScrollingBanner from "../components/scroll";
import API_BASE_URL from "../api"; 

export default function LandingPage() {
  const navigate = useNavigate();
  const lpHeroRef = useRef(null);
  const lpClubsRef = useRef(null);
  const lpEventsRef = useRef(null);
  const lpContactRef = useRef(null);
  const lpObjectivesRef = useRef(null);
  const lpHeroImageRef = useRef(null);
  const [lpIsMenuOpen, setLpIsMenuOpen] = useState(false);
  const [lpShowBackToTop, setLpShowBackToTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return value;
    }
    return null;
  };

  const fetchUserDetails = async () => {
    try {
      console.log(`Fetching user details from ${API_BASE_URL}/student/me...`);
      const response = await axios.get(`${API_BASE_URL}/student/me`, {
        withCredentials: true,
      });
      console.log("User details fetched successfully:", response.data);
      setUser(response.data);
      return true;
    } catch (err) {
      console.error("Error fetching user details:", err.response?.data || err.message);
      setError(`Failed to load user details: ${err.response?.data?.message || err.message}. Please try logging in again.`);
      return false;
    }
  };

  useEffect(() => {
    const isLoggedIn = getCookie('isLoggedIn');
    if (isLoggedIn === 'true') {
      fetchUserDetails();
    }
  }, []);

  const handleProfileClick = () => {
    navigate('/student-profile');
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setLpIsMenuOpen(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const refs = [lpHeroRef, lpClubsRef, lpEventsRef, lpContactRef, lpObjectivesRef];
    refs.forEach((ref, index) => {
      if (ref.current) {
        observer.observe(ref.current);
      } else {
        console.warn(`Ref at index ${index} is null`, ref);
      }
    });

    return () => observer.disconnect();
  }, []);

  const toggleMenu = () => {
    setLpIsMenuOpen(!lpIsMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setLpShowBackToTop(window.scrollY > 300);
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const createRipple = (event) => {
    const heroImage = lpHeroImageRef.current;
    if (!heroImage) return;

    const ripple = document.createElement("span");
    ripple.classList.add("lp-ripple");

    const diameter = Math.max(heroImage.clientWidth, heroImage.clientHeight);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - heroImage.getBoundingClientRect().left - radius}px`;
    ripple.style.top = `${event.clientY - heroImage.getBoundingClientRect().top - radius}px`;

    heroImage.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 1000);
  };

  const handleRegisterClick = () => {
    navigate("/club-registration");
  };

  const getUserInitials = () => {
    const userName = user?.name || getCookie('userName') || "Guest";
    return userName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className={`lp-navbar ${isScrolled ? "lp-scrolled" : ""}`} role="navigation" aria-label="Main navigation">
        <button
          className={`lp-hamburger ${lpIsMenuOpen ? "lp-open" : ""}`}
          onClick={toggleMenu}
          aria-label={lpIsMenuOpen ? "Close menu" : "Open menu"}
        >
          <span className="lp-hamburger-line"></span>
          <span className="lp-hamburger-line"></span>
          <span className="lp-hamburger-line"></span>
        </button>
        <div className={`lp-nav-links ${lpIsMenuOpen ? "lp-open" : ""}`}>
          <div className="lp-nav-links-center">
            <a
              className="lp-nav-link"
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(lpHeroRef);
              }}
              aria-current="page"
            >
              Home
            </a>
            <a
              className="lp-nav-link"
              href="#about-hive"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(lpClubsRef);
              }}
            >
              About Hive
            </a>
            <a
              className="lp-nav-link"
              href="#objectives"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(lpObjectivesRef);
              }}
            >
              Objectives
            </a>
            <a
              className="lp-nav-link"
              href="#clubs"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(lpClubsRef);
              }}
            >
              Clubs
            </a>
            <a
              className="lp-nav-link"
              href="#events"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(lpEventsRef);
              }}
            >
              Events
            </a>
            <a
              className="lp-nav-link"
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(lpContactRef);
              }}
            >
              Contact
            </a>
            <button
              className="lp-register-btn lp-nav-register"
              onClick={handleRegisterClick}
              aria-label="Register for Clubs"
            >
              Register
            </button>
          </div>
          <div
            className="lp-profile-photo"
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
            title="User Profile"
            aria-label="User Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24px"
              height="24px"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" ref={lpHeroRef} className="lp-hero lp-full-section">
        <div className="lp-hero-container">
          <div className="lp-hero-overlay"></div>
          <div
            className="lp-hero-image"
            ref={lpHeroImageRef}
            role="img"
            aria-label="PSG Tech campus background"
            onMouseMove={createRipple}
          ></div>
          <div className="lp-hero-content">
            <h2>Join. Engage. Lead.</h2>
            <p>Discover vibrant student clubs and events at PSG Tech's Hive platform.</p>
            <button
              className="lp-register-btn"
              onClick={handleRegisterClick}
              aria-label="Join Clubs Now"
            >
              Join Clubs Now
            </button>
          </div>
        </div>
      </section>

      {/* Scrolling Banner */}
      <ScrollingBanner text="Explore Clubs at PSG Tech" speed={20} />

      {/* About Hive Section */}
      <section id="about-hive" ref={lpClubsRef} className="about-hive-section">
        <h2 className="section-heading">About Hive</h2>
        <p className="section-description">
          Hive by PSG Tech is a dynamic platform designed to streamline club activities at PSG College of Technology. 
          Whether you're a student looking to join a club, an admin managing events, or a faculty advisor overseeing operations, 
          Hive provides a seamless experience to engage, collaborate, and lead. Explore a variety of clubs, stay updated with upcoming events, 
          and connect with the vibrant community at PSG Tech.
        </p>
      </section>

      {/* Objectives of Affiliated Clubs Section */}
      <section id="objectives" ref={lpObjectivesRef} className="objectives-section">
        <h2 className="section-heading">Objectives of Affiliated Clubs of Students Union</h2>
        <ul className="objectives-list">
          <li>
            To foster leadership skills by encouraging students to take initiative, guide teams, and make responsible decisions in various activities under the guidance of senior faculty members.
          </li>
          <li>
            To improve verbal and non-verbal communication abilities through interactive sessions, public speaking, group discussions, event coordination, and ability to work with other members.
          </li>
          <li>
            To instill discipline, integrity, confidence, and a sense of responsibility, contributing to the overall character development of students.
          </li>
          <li>
            To involve students in community-oriented programmes to develop empathy, civic sense, and a commitment to societal well-being through entrepreneurial attitude and associated skills.
          </li>
          <li>
            To cultivate a spirit of cooperation, coordination, and mutual respect through group tasks and collaborative projects by learning to understand different perspectives of peers and agree to work for a common objective.
          </li>
        </ul>
      </section>

      {/* Clubs Section */}
      <section id="clubs" className="clubs-section">
        <ClubList />
      </section>

      {/* Events Section */}
      <section id="events" ref={lpEventsRef} className="events-section">
        <EventCard />
      </section>

      {/* Contact Section */}
      <section id="contact" ref={lpContactRef} className="lp-contact-section">
        <div className="lp-contact-content">
          <div className="lp-contact-info">
            <h2 className="section-heading">Contact Us</h2>
            <p>PSG College of Technology</p>
            <p>Post Box No. 1611, Peelamedu</p>
            <p>Coimbatore - 641004, Tamil Nadu, India</p>
            <p>📞 0422-2572177</p>
            <p>📧 <a href="mailto:contact@psgtech.ac.in">contact@psgtech.ac.in</a></p>
          </div>
          <iframe
            className="lp-map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.217855150268!2d77.00063321461819!3d11.024254450582806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8582f1435fa59%3A0x137d95bfd8909293!2sPSG%20College%20Of%20Technology!5e0!3m2!1sen!2sin!4v1684144627227!5m2!1sen!2sin"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="PSG College Location"
          ></iframe>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <p>PSG Tech Hive © 2025 | All rights reserved.</p>
        </div>
      </footer>

      {/* Back to Top Button */}
      {lpShowBackToTop && (
        <button
          className="lp-back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to Top"
        >
          Back to Top
        </button>
      )}
    </div>
  );
}