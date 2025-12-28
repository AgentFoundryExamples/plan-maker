import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './AppLayout.css';

const AppLayout: React.FC = () => {
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
                    <Link to="/">Plan Input</Link>
                  </li>
                  <li>
                    <Link to="/plans">Plans List</Link>
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
