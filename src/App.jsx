// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import LoadingScreen from './components/LoadingScreen';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Collection from './pages/Collection';
import ShowDetail from './pages/ShowDetail';
import MovieDetail from './pages/MovieDetail';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import HouseholdSetup from './pages/HouseholdSetup';

function AppRoutes() {
  const { auth: { user, profile, loading }, toast } = useApp();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <>
        <Toast toast={toast.toast} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  if (!profile?.householdId) {
    return (
      <>
        <Toast toast={toast.toast} />
        <Routes>
          <Route path="/household-setup" element={<HouseholdSetup />} />
          <Route path="*" element={<Navigate to="/household-setup" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toast toast={toast.toast} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/show/:id" element={<ShowDetail />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Navbar />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
