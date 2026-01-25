/**
 * Hero Component
 * 
 * Hero section di Home page dengan:
 * - Welcome title & subtitle
 * - Integrated SearchBar
 * - Features showcase (AI Recommendations, Location Search, Save Favorites)
 * 
 * @component
 */
import React from 'react';
import SearchBar from './SearchBar';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Discover Amazing Places Around the World <i className="bi bi-globe-americas"></i>
        </h1>
        <p className="hero-subtitle">
          Explore tourist destinations, get AI-powered recommendations, and create your perfect travel wishlist
        </p>
        <SearchBar />
      </div>
      <div className="hero-features">
        <div className="feature-item">
          <span className="feature-icon"><i className="bi bi-robot"></i></span>
          <h3>AI Recommendations</h3>
          <p>Get personalized travel suggestions powered by Gemini AI</p>
        </div>
        <div className="feature-item">
          <span className="feature-icon"><i className="bi bi-geo-alt-fill"></i></span>
          <h3>Location Search</h3>
          <p>Find places near you with Geoapify integration</p>
        </div>
        <div className="feature-item">
          <span className="feature-icon"><i className="bi bi-heart-fill text-danger"></i></span>
          <h3>Save Favorites</h3>
          <p>Create your personal wishlist of dream destinations</p>
        </div>
      </div>
    </section>
  );
}
