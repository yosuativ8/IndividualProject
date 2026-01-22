// App Component - Main aplikasi dengan routing dan Redux Provider
// Menggunakan React Router untuk navigasi antar halaman
// Redux untuk state management global (auth, places, wishlist)
// Bootstrap untuk styling

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import store from './store/store';
import { fetchWishlist } from './store/slices/wishlistSlice';

// Import pages
import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import PlaceDetails from './Pages/PlaceDetails';
import SearchResults from './Pages/SearchResults';
import Wishlist from './Pages/Wishlist';

// Import components
import Navbar from './component/Navbar';
import ChatBot from './component/ChatBot';

function AppContent() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Hide navbar and chatbot on login and register pages
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';
  const hideChatBot = location.pathname === '/login' || location.pathname === '/register';

  // Fetch wishlist on app load if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <div className="app">
      {/* Navbar - Hidden on login and register pages */}
      {!hideNavbar && <Navbar />}
      
      {/* Floating ChatBot - Only for authenticated users, hidden on login/register */}
      {!hideChatBot && isAuthenticated && <ChatBot />}
      
      {/* Main Content - Routes */}
      <main>
        <Routes>
          {/* Login/Register Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
              {/* Home Page - Public */}
              <Route path="/" element={<Home />} />
              
              {/* Place Details Page - Public */}
              <Route path="/place/:id" element={<PlaceDetails />} />
              
              {/* Search Results Page - Public */}
              <Route path="/search" element={<SearchResults />} />
              
              {/* Wishlist Page - Protected (tapi bisa diakses, cuma redirect ke login jika belum login) */}
              <Route path="/wishlist" element={<Wishlist />} />
              
              {/* 404 Not Found */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}
