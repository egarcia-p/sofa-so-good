// src/components/Navbar.jsx
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const navItems = [
  { to: '/', icon: '🏠', label: 'Home', id: 'nav-home' },
  { to: '/search', icon: '🔍', label: 'Search', id: 'nav-search' },
  { to: '/collection', icon: '📚', label: 'Library', id: 'nav-library' },
  { to: '/profile', icon: '👤', label: 'Profile', id: 'nav-profile' },
];

export default function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {navItems.map(({ to, icon, label, id }) => (
        <NavLink
          key={to}
          to={to}
          id={id}
          end={to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
          aria-label={label}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
