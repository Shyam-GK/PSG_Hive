import React from 'react';
import './scroll.css';

const ScrollingBanner = ({ text = "Explore Clubs at PSG Tech", speed = 20 }) => {
  const repeatedText = `${text} ✧ `.repeat(20);

  return (
    <div className="scrolling-banner-container">
      <div
        className="scrolling-banner-track"
        style={{ animationDuration: `${speed}s` }}
      >
        <span>{repeatedText}</span>
        <span>{repeatedText}</span>
      </div>
    </div>
  );
};

export default ScrollingBanner;