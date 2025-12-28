import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './AppLayout.css';

const AppLayout: React.FC = () => {
  const location = useLocation();
  
  // Helper function to check if a route is active
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="app-layout">
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <h1 className="app-title">
                <Link to="/">Agent Foundry Plan Maker</Link>
              </h1>
              <nav className="app-nav" aria-label="Main navigation">
                <ul className="nav-list">
                  <li>
                    <Link 
                      to="/" 
                      className={isActive('/') ? 'active' : ''}
                      aria-current={isActive('/') ? 'page' : undefined}
                    >
                      Plan Input
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/plans" 
                      className={isActive('/plans') ? 'active' : ''}
                      aria-current={isActive('/plans') ? 'page' : undefined}
                    >
                      Plans List
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>
        <main id="main-content" className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default AppLayout;
