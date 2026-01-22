# Tourism Places - Client (Frontend)

Frontend aplikasi Tourism Places menggunakan **Vite + React.js + Redux** dengan fitur AI-powered recommendations dan location-based search.

## 🚀 Tech Stack

- **React.js 19** - UI Library
- **Vite 7** - Build Tool & Dev Server
- **Redux Toolkit** - State Management
- **React Router DOM** - Routing & Navigation
- **Axios** - HTTP Client
- **Google OAuth** - Authentication
- **CSS3** - Styling (Custom CSS dengan Responsive Design)

## 📁 Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── component/       # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Hero.jsx
│   │   ├── PlaceCard.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Loading.jsx
│   │   └── ErrorMessage.jsx
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── PlaceDetails.jsx
│   │   ├── SearchResults.jsx
│   │   └── Wishlist.jsx
│   ├── store/          # Redux store
│   │   ├── store.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── placesSlice.js
│   │       └── wishlistSlice.js
│   ├── App.jsx         # Main App component
│   ├── App.css         # Main styles
│   ├── index.css       # Base styles
│   └── main.jsx        # Entry point
├── .env                # Environment variables
├── .env.example        # Environment variables template
├── package.json
└── vite.config.js
```

## 🎯 Features

### ✅ Point 5: Vite + React.js Implementation

#### State Management dengan Redux
- **Redux Toolkit** untuk state management yang efisien
- **Three main slices**:
  - `authSlice.js` - Mengelola authentication state (login, register, Google Sign-In)
  - `placesSlice.js` - Mengelola places data (fetch places, search, details, AI recommendations)
  - `wishlistSlice.js` - Mengelola user wishlist/destinations

#### Implementasi Component
Komponen-komponen reusable yang digunakan:
- **Navbar** - Navigation bar dengan authentication
- **Hero** - Hero section dengan search bar
- **PlaceCard** - Card component untuk display place
- **SearchBar** - Search component dengan Geoapify integration
- **Loading** - Loading state component
- **ErrorMessage** - Error handling component
- **Footer** - Footer dengan links dan info

#### Router Implementation
React Router DOM untuk navigasi:
- `/` - Home page (semua places)
- `/place/:id` - Place details page
- `/search` - Search results page
- `/wishlist` - User wishlist page (protected)
- `*` - 404 Not Found page

### ✅ Point 6: Redux State Management - Fetching Data

Semua data fetching dilakukan melalui **Redux store** menggunakan `createAsyncThunk`:

#### Places State
```javascript
// Fetch all places dari backend
dispatch(fetchPlaces())

// Fetch place detail by ID
dispatch(fetchPlaceById(id))

// Search places by location (Geoapify)
dispatch(searchPlacesByLocation(query))

// Get AI recommendation
dispatch(getAIRecommendation(placeId))
```

#### Wishlist State
```javascript
// Fetch user wishlist
dispatch(fetchWishlist())

// Add place to wishlist
dispatch(addToWishlist(placeId))

// Remove from wishlist
dispatch(removeFromWishlist(destinationId))
```

#### Auth State
```javascript
// Login user
dispatch(login({ username, password }))

// Google Sign-In
dispatch(googleSignIn(googleToken))

// Logout
dispatch(logout())
```

## 🛠️ Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` ke `.env` dan isi dengan values yang sesuai:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# Google OAuth Client ID
# Get dari: https://console.cloud.google.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di: `http://localhost:5173`

## 📝 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🔗 API Integration

Client terhubung ke backend API di `http://localhost:3000`

### Redux Store Structure

```javascript
{
  auth: {
    user: { id, username, email },
    token: "jwt_token",
    isAuthenticated: true/false,
    isLoading: false,
    error: null
  },
  places: {
    places: [...],           // All places
    currentPlace: {...},     // Selected place detail
    searchResults: [...],    // Search results
    aiRecommendation: {...}, // AI recommendation
    isLoading: false,
    error: null
  },
  wishlist: {
    items: [...],  // User wishlist items
    isLoading: false,
    error: null
  }
}
```

## 📱 Responsive Design

- **Desktop**: > 768px
- **Tablet**: 481px - 768px
- **Mobile**: < 480px

---

**Note**: Pastikan backend server sudah running di `http://localhost:3000` sebelum menjalankan client!
