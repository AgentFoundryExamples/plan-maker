import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="container">
      <div className="text-center" style={{ paddingTop: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-3xl)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          404
        </h1>
        <h2>Page Not Found</h2>
        <p
          className="mt-md mb-lg"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
