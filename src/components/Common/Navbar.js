import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../shared/Button';
import ThemeToggle from '../shared/ThemeToggle';

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'text-white bg-white/10'
            : 'text-ink-200 hover:text-white hover:bg-white/5',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  );
}

function Navbar() {
  const { isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const closeMenu = () => setOpen(false);

  const authedLinks = (
    <>
      {userRole === 'user' && <NavItem to="/user" onClick={closeMenu}>Dashboard</NavItem>}
      {userRole === 'driver' && <NavItem to="/driver" onClick={closeMenu}>Dashboard</NavItem>}
      {userRole === 'admin' && <NavItem to="/admin" onClick={closeMenu}>Dashboard</NavItem>}
      <Button variant="danger" size="sm" onClick={handleLogout}>Logout</Button>
    </>
  );

  const guestLinks = (
    <>
      <NavItem to="/login/user" onClick={closeMenu}>User Login</NavItem>
      <NavItem to="/login/driver" onClick={closeMenu}>Driver Login</NavItem>
      <NavItem to="/login/admin" onClick={closeMenu}>Admin Login</NavItem>
      <Button as={Link} to="/register/user" variant="primary" size="sm" onClick={closeMenu}>
        Sign up
      </Button>
    </>
  );

  return (
    <nav className="sticky top-0 z-40 bg-ink-900/95 backdrop-blur border-b border-ink-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={closeMenu}>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-400/30">
            <img src="/delivery-truck.png" alt="" className="h-5 w-5 object-contain" />
          </span>
          <span className="text-white font-semibold tracking-tight text-lg group-hover:text-brand-200 transition-colors">
            Logi
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1.5">
          {isAuthenticated ? authedLinks : guestLinks}
          <ThemeToggle className="ml-1" />
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-ink-200 hover:text-white hover:bg-white/10"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink-800 bg-ink-900 animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1.5">
            {isAuthenticated ? authedLinks : guestLinks}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
