import React from 'react';
import { useParams, Link } from 'react-router-dom';

const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container">
      <Link to="/plans" style={{ display: 'inline-block', marginBottom: 'var(--spacing-md)' }}>
        ← Back to Plans List
      </Link>
      <h1>Plan Details</h1>
      <div className="card mt-lg">
        <h2>Plan #{id}</h2>
        <p>
          This placeholder page will display detailed information about the selected plan in future iterations.
        </p>
        <div className="mt-lg">
          <h3>Plan Information</h3>
          <p><strong>Plan ID:</strong> {id}</p>
          <p><strong>Status:</strong> Placeholder</p>
          <p><strong>Created:</strong> N/A</p>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailPage;
