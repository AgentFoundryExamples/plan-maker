import React from 'react';
import { Link } from 'react-router-dom';

const PlansListPage: React.FC = () => {
  return (
    <div className="container">
      <h1>Plans List</h1>
      <p>View and manage your software development plans here.</p>
      <div className="card mt-lg">
        <h2>Your Plans</h2>
        <p className="mb-md">
          This placeholder page will display a list of your plans in future
          iterations.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/plans/1" className="btn btn-primary">
            View Example Plan #1
          </Link>
          <Link to="/plans/2" className="btn btn-primary">
            View Example Plan #2
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlansListPage;
