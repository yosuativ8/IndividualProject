//membuat tampilan utama aplikasi
//dengan menggunakan routing untuk navigasi antar halaman
//dan menampilkan loading serta error handling saat mengambil data tempat sebelum dipindahkan ke helper.
// menggukan api PlaceAPI dan GeminiAPI untuk mengambil data tempat wisata.
//menambahkan setiap comment pada setiap baris kode untuk menjelaskan fungsinya.
//client menggunakan React untuk membuat tampilan frontend aplikasi.
//register dan login user akan menggunakan google sign in nanti.

import React, { useState, useEffect } from 'react';
// import PlaceAPI from './api/PlaceAPI';
// import GeminiAPI from './api/GeminiAPI';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import PlaceDetails from './pages/PlaceDetails';
import SearchResults from './pages/SearchResults';
// import Navbar from './components/Navbar';

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        // const placeData = await PlaceAPI.getPlaces();
        // setPlaces(placeData);
        setError(null);
      } catch (error) {
        console.error('Error fetching places:', error);
        setError('Failed to load places. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading amazing places...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        {/* <Navbar /> */}
        <Routes>
          <Route path="/" element={<Home places={places} />} />
          <Route path="/place/:id" element={<PlaceDetails />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}